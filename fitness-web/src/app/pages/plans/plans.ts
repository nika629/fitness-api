import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { WorkoutPlan } from '../../core/models';
import { PlanService } from '../../core/plan.service';
import { ToastStore } from '../../core/toast.store';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';

@Component({
  selector: 'app-plans-page',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plans.html',
  styleUrl: './plans.scss',
})
export class PlansPage {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(PlanService);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly plans = signal<WorkoutPlan[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly creating = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    workoutPlanName: ['', [Validators.required, Validators.maxLength(100)]],
    workoutPlanDescription: ['', Validators.maxLength(1000)],
  });

  constructor() {
    this.api.list(this.auth.userId()).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected openCreate(): void {
    this.form.reset();
    this.formError.set('');
    this.creating.set(true);
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.create(this.auth.userId(), this.form.getRawValue()).subscribe({
      next: (plan) => {
        this.toast.success('Plan created');
        this.saving.set(false);
        this.creating.set(false);
        this.router.navigate(['/plans', plan.workoutPlanID]);
      },
      error: (err) => {
        this.formError.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
