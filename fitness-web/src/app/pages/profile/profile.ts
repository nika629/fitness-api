import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { ConfirmStore } from '../../core/confirm.store';
import { UserProfile } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { UserService } from '../../core/user.service';

/** new password and "repeat" must match */
function samePasswords(group: AbstractControl): ValidationErrors | null {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirmNewPassword')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly auth = inject(AuthStore);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastStore);
  private readonly confirm = inject(ConfirmStore);
  private readonly fb = inject(FormBuilder);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly savingDetails = signal(false);
  protected readonly savingEmail = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly detailsError = signal('');
  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');

  protected readonly details = this.fb.group({
    userName: ['', [Validators.required, Validators.maxLength(50)]],
    userLastName: ['', [Validators.required, Validators.maxLength(50)]],
    userPhone: ['', Validators.maxLength(20)],
    birthDate: [''],
    height: [null as number | null, [Validators.min(50), Validators.max(260)]],
    currentWeight: [null as number | null, [Validators.min(20), Validators.max(400)]],
    goalWeight: [null as number | null, [Validators.min(20), Validators.max(400)]],
  });

  protected readonly email = this.fb.nonNullable.group({
    newEmail: ['', [Validators.required, Validators.email]],
    currentPassword: ['', Validators.required],
  });

  protected readonly password = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required],
    },
    { validators: samePasswords },
  );

  constructor() {
    this.users.me().subscribe({
      next: (p) => {
        this.fill(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.detailsError.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private fill(p: UserProfile): void {
    this.profile.set(p);
    this.details.reset({
      userName: p.userName,
      userLastName: p.userLastName,
      userPhone: p.userPhone,
      birthDate: p.birthDate ? p.birthDate.substring(0, 10) : '',
      height: p.height,
      currentWeight: p.currentWeight,
      goalWeight: p.goalWeight,
    });
  }

  protected saveDetails(): void {
    if (this.details.invalid) {
      this.details.markAllAsTouched();
      this.detailsError.set('Check the highlighted fields.');
      return;
    }
    const v = this.details.getRawValue();
    this.savingDetails.set(true);
    this.detailsError.set('');
    this.users
      .update(this.auth.userId(), {
        userName: v.userName ?? undefined,
        userLastName: v.userLastName ?? undefined,
        userPhone: v.userPhone ?? '',
        birthDate: v.birthDate ? `${v.birthDate}T00:00:00Z` : undefined,
        height: v.height ?? undefined,
        currentWeight: v.currentWeight ?? undefined,
        goalWeight: v.goalWeight ?? undefined,
      })
      .subscribe({
        next: (p) => {
          this.fill(p);
          this.auth.updateName(p.userName);
          this.toast.success('Profile saved');
          this.savingDetails.set(false);
        },
        error: (err) => {
          this.detailsError.set(errorMessage(err));
          this.savingDetails.set(false);
        },
      });
  }

  protected saveEmail(): void {
    if (this.email.invalid) {
      this.email.markAllAsTouched();
      return;
    }
    const v = this.email.getRawValue();
    this.savingEmail.set(true);
    this.emailError.set('');
    this.users.changeEmail(this.auth.userId(), v.newEmail, v.currentPassword).subscribe({
      next: () => {
        this.profile.update((p) => (p ? { ...p, userEmail: v.newEmail.toLowerCase() } : p));
        this.email.reset();
        this.toast.success('Email changed');
        this.savingEmail.set(false);
      },
      error: (err) => {
        this.emailError.set(errorMessage(err));
        this.savingEmail.set(false);
      },
    });
  }

  protected savePassword(): void {
    if (this.password.invalid) {
      this.password.markAllAsTouched();
      return;
    }
    const v = this.password.getRawValue();
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.users.changePassword(this.auth.userId(), v.currentPassword, v.newPassword, v.confirmNewPassword).subscribe({
      next: () => {
        this.password.reset();
        this.toast.success('Password changed');
        this.savingPassword.set(false);
      },
      error: (err) => {
        this.passwordError.set(errorMessage(err));
        this.savingPassword.set(false);
      },
    });
  }

  protected async deleteAccount(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete your account?',
      message: 'Your plans, favorites and food log will be deleted for good. This cannot be undone.',
      confirmText: 'Delete my account',
    });
    if (!ok) return;
    this.users.delete(this.auth.userId()).subscribe({
      next: () => {
        this.toast.success('Account deleted');
        this.auth.logout();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
