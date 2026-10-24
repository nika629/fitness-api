import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { ConfirmStore } from '../../core/confirm.store';
import { ExerciseService } from '../../core/exercise.service';
import { LookupsStore } from '../../core/lookups.store';
import { DIFFICULTIES, Exercise } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';

@Component({
  selector: 'app-admin-exercises-page',
  imports: [ReactiveFormsModule, FormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Manage exercises</h1>
          <p>Add, edit or remove exercises in the catalog. An exercise used in someone's plan can't be deleted.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="openCreate()">
          <app-icon name="plus" [size]="18" /> New exercise
        </button>
      </header>

      <div class="search">
        <app-icon name="search" [size]="18" />
        <input class="input" type="search" placeholder="Search by name" aria-label="Search exercises"
               [ngModel]="search()" (ngModelChange)="search.set($event)" />
      </div>

      @if (loading()) {
        <div class="skeleton" style="min-height: 300px"></div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Muscle group</th>
                <th>Equipment</th>
                <th>Difficulty</th>
                <th><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (e of visible(); track e.exerciseID) {
                <tr>
                  <td data-label="Name"><strong>{{ e.exerciseName }}</strong></td>
                  <td data-label="Muscle" class="muted">{{ e.muscleGroupName }}</td>
                  <td data-label="Equipment" class="muted">{{ e.equipmentName ?? 'None' }}</td>
                  <td data-label="Difficulty">
                    <span class="badge" [class]="badgeFor(e.exerciseDifficulty)">{{ e.exerciseDifficulty }}</span>
                  </td>
                  <td class="actions">
                    <button class="icon-btn" type="button" (click)="openEdit(e)" [attr.aria-label]="'Edit ' + e.exerciseName">
                      <app-icon name="edit" [size]="18" />
                    </button>
                    <button class="icon-btn danger" type="button" (click)="remove(e)" [attr.aria-label]="'Delete ' + e.exerciseName">
                      <app-icon name="trash" [size]="18" />
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">No exercises found.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (dialogOpen()) {
      <app-modal [title]="editing() ? 'Edit ' + editing()!.exerciseName : 'New exercise'" (closed)="dialogOpen.set(false)">
        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
          @if (formError()) {
            <p class="form-error" role="alert">{{ formError() }}</p>
          }
          <label class="field">
            <span>Name</span>
            <input class="input" formControlName="exerciseName" />
            @if (form.controls.exerciseName.touched && form.controls.exerciseName.invalid) {
              <span class="error">Enter a name.</span>
            }
          </label>
          <label class="field">
            <span>How to do it</span>
            <textarea class="textarea" formControlName="exerciseDescription"></textarea>
          </label>
          <div class="form-row">
            <label class="field">
              <span>Muscle group</span>
              <select class="select" formControlName="muscleGroupID">
                <option [ngValue]="0" disabled>Choose</option>
                @for (m of lookups.muscleGroups(); track m.dictionaryID) {
                  <option [ngValue]="m.dictionaryID">{{ m.dictionaryCaption }}</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Equipment</span>
              <select class="select" formControlName="equipmentID">
                <option [ngValue]="null">None</option>
                @for (q of lookups.equipment(); track q.dictionaryID) {
                  <option [ngValue]="q.dictionaryID">{{ q.dictionaryCaption }}</option>
                }
              </select>
            </label>
          </div>
          <label class="field">
            <span>Difficulty</span>
            <select class="select" formControlName="exerciseDifficulty">
              @for (d of difficulties; track d) {
                <option [value]="d">{{ d }}</option>
              }
            </select>
          </label>
          <div class="form-actions">
            <button class="btn" type="button" (click)="dialogOpen.set(false)">Cancel</button>
            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Add exercise' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: `
    .search { position: relative; max-width: 420px; }
    .search app-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); }
    .search .input { padding-left: 40px; }
  `,
})
export class AdminExercisesPage {
  private readonly api = inject(ExerciseService);
  private readonly toast = inject(ToastStore);
  private readonly confirm = inject(ConfirmStore);
  protected readonly lookups = inject(LookupsStore);
  protected readonly difficulties = DIFFICULTIES;

  protected readonly exercises = signal<Exercise[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<Exercise | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly visible = computed(() => {
    const t = this.search().trim().toLowerCase();
    return this.exercises().filter((e) => !t || e.exerciseName.toLowerCase().includes(t));
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    exerciseName: ['', [Validators.required, Validators.maxLength(100)]],
    exerciseDescription: ['', Validators.maxLength(1000)],
    exerciseDifficulty: ['Beginner', Validators.required],
    muscleGroupID: [0, Validators.min(1)],
    equipmentID: [null as number | null],
  });

  constructor() {
    this.lookups.load();
    this.api.list().subscribe({
      next: (list) => {
        this.exercises.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected badgeFor(d: string): string {
    return d === 'Advanced' ? 'badge badge-red' : d === 'Intermediate' ? 'badge badge-yellow' : 'badge badge-green';
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset({ exerciseName: '', exerciseDescription: '', exerciseDifficulty: 'Beginner', muscleGroupID: 0, equipmentID: null });
    this.formError.set('');
    this.saving.set(false);
    this.dialogOpen.set(true);
  }

  protected openEdit(e: Exercise): void {
    this.editing.set(e);
    this.form.reset({
      exerciseName: e.exerciseName,
      exerciseDescription: e.exerciseDescription,
      exerciseDifficulty: e.exerciseDifficulty || 'Beginner',
      muscleGroupID: e.muscleGroupID,
      equipmentID: e.equipmentID,
    });
    this.formError.set('');
    this.saving.set(false);
    this.dialogOpen.set(true);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Fill in the name and choose a muscle group.');
      return;
    }
    const body = this.form.getRawValue();
    const current = this.editing();
    this.saving.set(true);
    const request = current ? this.api.update(current.exerciseID, body) : this.api.create(body);
    request.subscribe({
      next: (saved) => {
        this.exercises.update((list) =>
          current ? list.map((x) => (x.exerciseID === saved.exerciseID ? saved : x)) : [saved, ...list],
        );
        this.toast.success(current ? 'Exercise saved' : `${saved.exerciseName} added`);
        this.dialogOpen.set(false);
      },
      error: (err) => {
        this.formError.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }

  protected async remove(e: Exercise): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${e.exerciseName}?`,
      message: "It will disappear from the catalog and from everyone's favorites.",
      confirmText: 'Delete exercise',
    });
    if (!ok) return;
    this.api.delete(e.exerciseID).subscribe({
      next: () => {
        this.exercises.update((list) => list.filter((x) => x.exerciseID !== e.exerciseID));
        this.toast.success(`${e.exerciseName} deleted`);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
