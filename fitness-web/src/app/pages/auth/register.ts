import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { AuthWall } from './auth-wall';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, AuthWall],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.scss',
  template: `
    <app-auth-wall />

    <section class="form-side">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div>
          <h1>Create your account</h1>
          <p class="lead">It takes a minute. You can add your weight and goals later.</p>
        </div>

        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }

        <div class="form-row">
          <label class="field">
            <span>First name</span>
            <input class="input" formControlName="userName" autocomplete="given-name" />
            @if (form.controls.userName.touched && form.controls.userName.invalid) {
              <span class="error">Enter your first name.</span>
            }
          </label>
          <label class="field">
            <span>Last name</span>
            <input class="input" formControlName="userLastname" autocomplete="family-name" />
            @if (form.controls.userLastname.touched && form.controls.userLastname.invalid) {
              <span class="error">Enter your last name.</span>
            }
          </label>
        </div>

        <label class="field">
          <span>Email</span>
          <input class="input" type="email" formControlName="userEmail" autocomplete="email" />
          @if (form.controls.userEmail.touched && form.controls.userEmail.invalid) {
            <span class="error">Enter a valid email address.</span>
          }
        </label>

        <label class="field">
          <span>Phone <small>(optional)</small></span>
          <input class="input" type="tel" formControlName="userPhone" autocomplete="tel" />
        </label>

        <label class="field">
          <span>Password</span>
          <input class="input" type="password" formControlName="userPassword" autocomplete="new-password" />
          @if (form.controls.userPassword.touched && form.controls.userPassword.invalid) {
            <span class="error">Use at least 6 characters.</span>
          } @else {
            <small>At least 6 characters.</small>
          }
        </label>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Creating account…' : 'Create account' }}
        </button>

        <p class="switch">Already have an account? <a routerLink="/login">Log in</a></p>
      </form>
    </section>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    userName: ['', [Validators.required, Validators.maxLength(50)]],
    userLastname: ['', [Validators.required, Validators.maxLength(50)]],
    userEmail: ['', [Validators.required, Validators.email]],
    userPhone: [''],
    userPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
