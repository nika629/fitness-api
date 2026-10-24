import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../core/api';
import { AuthStore } from '../core/auth.store';
import { WorkoutPlan } from '../core/models';
import { PlanService } from '../core/plan.service';
import { ToastStore } from '../core/toast.store';
import { Modal } from './modal';

/** "Add to plan" dialog used on the exercise catalog and favorites */
@Component({
  selector: 'app-add-to-plan',
  imports: [Modal, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="'Add ' + exerciseName() + ' to a plan'" (closed)="closed.emit()">
      @if (loading()) {
        <div class="skeleton"></div>
      } @else if (plans().length === 0) {
        <div class="empty">
          <h3>You don't have a plan yet</h3>
          <p>Create a plan first, then add exercises to it.</p>
          <a class="btn btn-sm btn-primary" routerLink="/plans" (click)="closed.emit()">Create a plan</a>
        </div>
      } @else {
        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <label class="field">
            <span>Plan</span>
            <select class="select" formControlName="planId">
              @for (p of plans(); track p.workoutPlanID) {
                <option [ngValue]="p.workoutPlanID">{{ p.workoutPlanName }}</option>
              }
            </select>
          </label>
          <div class="form-row">
            <label class="field">
              <span>Sets</span>
              <input class="input" type="number" min="1" max="100" formControlName="sets" />
            </label>
            <label class="field">
              <span>Reps</span>
              <input class="input" type="number" min="1" max="1000" formControlName="reps" />
            </label>
            <label class="field">
              <span>Rest (seconds)</span>
              <input class="input" type="number" min="0" max="3600" step="15" formControlName="restTime" />
            </label>
          </div>
          <div class="form-actions">
            <button class="btn" type="button" (click)="closed.emit()">Cancel</button>
            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Adding…' : 'Add to plan' }}
            </button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class AddToPlan {
  readonly exerciseId = input.required<number>();
  readonly exerciseName = input.required<string>();
  readonly closed = output<void>();

  private readonly auth = inject(AuthStore);
  private readonly api = inject(PlanService);
  private readonly toast = inject(ToastStore);

  protected readonly plans = signal<WorkoutPlan[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    planId: [0, Validators.min(1)],
    sets: [3, [Validators.required, Validators.min(1), Validators.max(100)]],
    reps: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
    restTime: [90, [Validators.required, Validators.min(0), Validators.max(3600)]],
  });

  constructor() {
    this.api.list(this.auth.userId()).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        if (plans.length) this.form.controls.planId.setValue(plans[0].workoutPlanID);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Check the numbers: sets and reps must be at least 1.');
      return;
    }
    const v = this.form.getRawValue();
    const plan = this.plans().find((p) => p.workoutPlanID === v.planId);
    this.saving.set(true);
    this.api
      .addExercise(this.auth.userId(), {
        workoutPlanID: v.planId,
        exerciseID: this.exerciseId(),
        sets: v.sets,
        reps: v.reps,
        restTime: v.restTime,
        orderNumber: (plan?.exerciseCount ?? 0) + 1,
      })
      .subscribe({
        next: () => {
          this.toast.success(`Added to ${plan?.workoutPlanName ?? 'plan'}`);
          this.closed.emit();
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.saving.set(false);
        },
      });
  }
}
