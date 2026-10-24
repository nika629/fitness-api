import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { AuthStore } from './auth.store';
import { FavoriteExercise } from './models';

/**
 * Favorites shared by every page (catalog hearts, favorites page, dashboard).
 * Loaded once, then kept in sync locally after each add/remove.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);

  private readonly _items = signal<FavoriteExercise[]>([]);
  private loadedFor = 0;

  readonly items = this._items.asReadonly();
  readonly ids = computed(() => new Set(this._items().map((f) => f.exerciseID)));
  readonly loading = signal(false);

  private get base() {
    return `${API}/FavoriteExercise/${this.auth.userId()}`;
  }

  /** Loads favorites once per logged-in user (force = reload anyway) */
  load(force = false): void {
    const userId = this.auth.userId();
    if (!userId || (!force && this.loadedFor === userId)) return;
    this.loadedFor = userId;
    this.loading.set(true);
    this.http.get<FavoriteExercise[]>(`${this.base}/favoriteExercises`).subscribe({
      next: (items) => {
        this._items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loadedFor = 0;
        this.loading.set(false);
      },
    });
  }

  isFavorite(exerciseId: number): boolean {
    return this.ids().has(exerciseId);
  }

  add(exerciseId: number): Observable<FavoriteExercise> {
    return this.http
      .post<FavoriteExercise>(`${this.base}/favoriteExercise`, { exerciseID: exerciseId })
      .pipe(tap((fav) => this._items.update((list) => [...list, fav])));
  }

  remove(exerciseId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/favoriteExercise/${exerciseId}`)
      .pipe(tap(() => this._items.update((list) => list.filter((f) => f.exerciseID !== exerciseId))));
  }

  /** Called on logout / user switch */
  reset(): void {
    this._items.set([]);
    this.loadedFor = 0;
  }
}
