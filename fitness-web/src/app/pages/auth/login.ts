import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { AuthWall } from './auth-wall';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, AuthWall],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.scss',
  template: `
    <app-auth-wall />

    <section class="form-side">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div>
          <h1>Log in</h1>
          <p class="lead">Pick up where you left off.</p>
        </div>

        @if (reason() === 'expired') {
          <p class="notice">Your session ended. Log in again to continue.</p>
        }
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }

        <label class="field">
          <span>Email</span>
          <input class="input" type="email" formControlName="userEmail" autocomplete="email" />
          @if (form.controls.userEmail.touched && form.controls.userEmail.invalid) {
            <span class="error">Enter a valid email address.</span>
          }
        </label>

        <label class="field">
          <span>Password</span>
          <input class="input" type="password" formControlName="userPassword" autocomplete="current-password" />
          @if (form.controls.userPassword.touched && form.controls.userPassword.invalid) {
            <span class="error">Enter your password.</span>
          }
        </label>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Logging in…' : 'Log in' }}
        </button>

        <p class="switch">New here? <a routerLink="/register">Create an account</a></p>
      </form>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** ?reason=expired from the URL */
  readonly reason = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    userEmail: ['', [Validators.required, Validators.email]],
    userPassword: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
