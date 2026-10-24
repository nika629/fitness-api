import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { FavoritesStore } from '../../core/favorites.store';
import { FavoriteExercise } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { AddToPlan } from '../../shared/add-to-plan';
import { ExerciseCard } from '../../shared/exercise-card';

@Component({
  selector: 'app-favorites-page',
  imports: [RouterLink, ExerciseCard, AddToPlan],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Favorites</h1>
          <p>Exercises you saved. Add them to a plan or remove them from here.</p>
        </div>
        <a class="btn" routerLink="/exercises">Browse exercises</a>
      </header>

      @if (store.loading() && store.items().length === 0) {
        <div class="grid">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton" style="min-height: 170px"></div>
          }
        </div>
      } @else if (store.items().length === 0) {
        <div class="empty">
          <h3>No favorites yet</h3>
          <p>Tap the heart on any exercise in the catalog and it will show up here.</p>
          <a class="btn btn-sm btn-primary" routerLink="/exercises">Browse exercises</a>
        </div>
      } @else {
        <div class="grid">
          @for (f of store.items(); track f.exerciseID) {
            <app-exercise-card
              [name]="f.exerciseName"
              [difficulty]="f.exerciseDifficulty"
              [muscle]="f.muscleGroupName"
              [equipment]="f.equipmentName"
              [description]="f.exerciseDescription"
              [favorite]="true"
              (toggleFavorite)="remove(f)"
              (addToPlan)="adding.set(f)"
            />
          }
        </div>
      }
    </div>

    @if (adding(); as f) {
      <app-add-to-plan [exerciseId]="f.exerciseID" [exerciseName]="f.exerciseName" (closed)="adding.set(null)" />
    }
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
  `,
})
export class FavoritesPage {
  protected readonly store = inject(FavoritesStore);
  private readonly toast = inject(ToastStore);
  protected readonly adding = signal<FavoriteExercise | null>(null);

  constructor() {
    this.store.load(true);
  }

  protected remove(f: FavoriteExercise): void {
    this.store.remove(f.exerciseID).subscribe({
      next: () => this.toast.success(`${f.exerciseName} removed from favorites`),
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
