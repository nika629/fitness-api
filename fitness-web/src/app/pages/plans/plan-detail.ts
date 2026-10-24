import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { ConfirmStore } from '../../core/confirm.store';
import { ExerciseService } from '../../core/exercise.service';
import { Exercise, WorkoutExercise, WorkoutPlan } from '../../core/models';
import { PlanService } from '../../core/plan.service';
import { ToastStore } from '../../core/toast.store';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';

type Dialog = 'edit-plan' | 'add' | 'edit-item' | null;

@Component({
  selector: 'app-plan-detail-page',
  imports: [RouterLink, ReactiveFormsModule, NgTemplateOutlet, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-detail.html',
  styleUrl: './plan-detail.scss',
})
export class PlanDetailPage {
  /** :id from the URL */
  readonly id = input.required<string>();

  private readonly auth = inject(AuthStore);
  private readonly api = inject(PlanService);
  private readonly exercisesApi = inject(ExerciseService);
  private readonly toast = inject(ToastStore);
  private readonly confirm = inject(ConfirmStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly plan = signal<WorkoutPlan | null>(null);
  protected readonly items = signal<WorkoutExercise[]>([]);
  protected readonly catalog = signal<Exercise[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  protected readonly dialog = signal<Dialog>(null);
  protected readonly editing = signal<WorkoutExercise | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly sorted = computed(() => [...this.items()].sort((a, b) => a.orderNumber - b.orderNumber));
  protected readonly totalSets = computed(() => this.items().reduce((s, i) => s + i.sets, 0));
  /** Rough session length: ~3 s per rep + rest after each set */
  protected readonly minutes = computed(() =>
    Math.round(this.items().reduce((s, i) => s + i.sets * (i.reps * 3 + i.restTime), 0) / 60),
  );

  /** Catalog grouped by muscle group for the <select> */
  protected readonly catalogGroups = computed(() => {
    const groups = new Map<string, Exercise[]>();
    for (const e of this.catalog()) {
      const key = e.muscleGroupName ?? 'Other';
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    return [...groups.entries()].map(([name, exercises]) => ({ name, exercises }));
  });

  protected readonly planForm = this.fb.group({
    workoutPlanName: ['', [Validators.required, Validators.maxLength(100)]],
    workoutPlanDescription: ['', Validators.maxLength(1000)],
  });

  protected readonly itemForm = this.fb.group({
    exerciseID: [0, Validators.min(1)],
    sets: [3, [Validators.required, Validators.min(1), Validators.max(100)]],
    reps: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
    restTime: [90, [Validators.required, Validators.min(0), Validators.max(3600)]],
    orderNumber: [1, [Validators.required, Validators.min(0), Validators.max(1000)]],
  });

  private get userId() {
    return this.auth.userId();
  }

  private get planId() {
    return Number(this.id());
  }

  constructor() {
    effect(() => {
      // runs when the :id changes
      this.id();
      this.load();
    });
    this.exercisesApi.list().subscribe((list) => this.catalog.set(list));
  }

  private load(): void {
    this.loading.set(true);
    this.api.get(this.userId, this.planId).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.api.exercises(this.userId, this.planId).subscribe({
          next: (items) => {
            this.items.set(items);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  // ----- plan -----
  protected openEditPlan(): void {
    const p = this.plan();
    if (!p) return;
    this.planForm.setValue({ workoutPlanName: p.workoutPlanName, workoutPlanDescription: p.workoutPlanDescription });
    this.open('edit-plan');
  }

  protected savePlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.update(this.userId, this.planId, this.planForm.getRawValue()).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.toast.success('Plan saved');
        this.close();
      },
      error: (err) => this.fail(err),
    });
  }

  protected async deletePlan(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete this plan?',
      message: `"${this.plan()?.workoutPlanName}" and its ${this.items().length} exercises will be removed. This can't be undone.`,
      confirmText: 'Delete plan',
    });
    if (!ok) return;
    this.api.delete(this.userId, this.planId).subscribe({
      next: () => {
        this.toast.success('Plan deleted');
        this.router.navigateByUrl('/plans');
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  // ----- exercises in the plan -----
  protected openAdd(): void {
    const next = Math.max(0, ...this.items().map((i) => i.orderNumber)) + 1;
    this.itemForm.reset({ exerciseID: 0, sets: 3, reps: 10, restTime: 90, orderNumber: next });
    this.open('add');
  }

  protected openEditItem(item: WorkoutExercise): void {
    this.editing.set(item);
    this.itemForm.reset({
      exerciseID: item.exerciseID,
      sets: item.sets,
      reps: item.reps,
      restTime: item.restTime,
      orderNumber: item.orderNumber,
    });
    this.open('edit-item');
  }

  protected saveItem(): void {
    if (this.dialog() === 'add' && this.itemForm.controls.exerciseID.value < 1) {
      this.itemForm.controls.exerciseID.markAsTouched();
      this.formError.set('Choose an exercise.');
      return;
    }
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.formError.set('Check the numbers: sets and reps must be at least 1.');
      return;
    }
    const v = this.itemForm.getRawValue();
    this.saving.set(true);

    if (this.dialog() === 'add') {
      this.api.addExercise(this.userId, { workoutPlanID: this.planId, ...v }).subscribe({
        next: (item) => {
          this.items.update((list) => [...list, item]);
          this.toast.success(`${item.exerciseName || 'Exercise'} added`);
          this.close();
        },
        error: (err) => this.fail(err),
      });
    } else {
      const id = this.editing()!.workoutExerciseID;
      const { sets, reps, restTime, orderNumber } = v;
      this.api.updateExercise(this.userId, id, { sets, reps, restTime, orderNumber }).subscribe({
        next: (item) => {
          this.items.update((list) => list.map((i) => (i.workoutExerciseID === id ? item : i)));
          this.toast.success('Changes saved');
          this.close();
        },
        error: (err) => this.fail(err),
      });
    }
  }

  protected async removeItem(item: WorkoutExercise): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Remove exercise?',
      message: `Remove ${item.exerciseName} from this plan?`,
      confirmText: 'Remove',
    });
    if (!ok) return;
    this.api.removeExercise(this.userId, item.workoutExerciseID).subscribe({
      next: () => {
        this.items.update((list) => list.filter((i) => i.workoutExerciseID !== item.workoutExerciseID));
        this.toast.success(`${item.exerciseName} removed`);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  protected formatRest(seconds: number): string {
    if (seconds < 60) return `${seconds} s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m} min ${s} s` : `${m} min`;
  }

  private open(d: Dialog): void {
    this.formError.set('');
    this.saving.set(false);
    this.dialog.set(d);
  }

  protected close(): void {
    this.dialog.set(null);
    this.editing.set(null);
    this.saving.set(false);
  }

  private fail(err: unknown): void {
    this.formError.set(errorMessage(err));
    this.saving.set(false);
  }
}
