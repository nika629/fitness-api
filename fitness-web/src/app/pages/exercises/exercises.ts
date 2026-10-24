import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { ExerciseService } from '../../core/exercise.service';
import { FavoritesStore } from '../../core/favorites.store';
import { LookupsStore } from '../../core/lookups.store';
import { Exercise } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { AddToPlan } from '../../shared/add-to-plan';
import { ExerciseCard } from '../../shared/exercise-card';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-exercises-page',
  imports: [FormsModule, ExerciseCard, AddToPlan, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exercises.html',
  styleUrl: './exercises.scss',
})
export class ExercisesPage {
  private readonly api = inject(ExerciseService);
  private readonly toast = inject(ToastStore);
  protected readonly lookups = inject(LookupsStore);
  protected readonly favorites = inject(FavoritesStore);

  protected readonly all = signal<Exercise[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  // filters
  protected readonly search = signal('');
  protected readonly muscleId = signal<number | null>(null);
  protected readonly equipmentId = signal<number | null>(null);
  protected readonly difficulty = signal<string>('');

  protected readonly adding = signal<Exercise | null>(null);

  /** Filtering happens in the browser, so results update while typing */
  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.all().filter(
      (e) =>
        (!term || e.exerciseName.toLowerCase().includes(term)) &&
        (!this.muscleId() || e.muscleGroupID === this.muscleId()) &&
        (!this.equipmentId() || e.equipmentID === this.equipmentId()) &&
        (!this.difficulty() || e.exerciseDifficulty === this.difficulty()),
    );
  });

  protected readonly hasFilters = computed(
    () => !!(this.search() || this.muscleId() || this.equipmentId() || this.difficulty()),
  );

  constructor() {
    this.lookups.load();
    this.favorites.load();
    this.api.list().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.muscleId.set(null);
    this.equipmentId.set(null);
    this.difficulty.set('');
  }

  protected toggleFavorite(e: Exercise): void {
    const onError = (err: unknown) => this.toast.error(errorMessage(err));
    if (this.favorites.isFavorite(e.exerciseID)) {
      this.favorites.remove(e.exerciseID).subscribe({ error: onError });
    } else {
      this.favorites.add(e.exerciseID).subscribe({ error: onError });
    }
  }
}
