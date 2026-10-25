import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { ConfirmStore } from '../../core/confirm.store';
import { WorkoutSession, WorkoutSessionSet } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { ToastStore } from '../../core/toast.store';
import { Icon } from '../../shared/icon';

/** One finished workout with all of its sets */
@Component({
  selector: 'app-session-detail-page',
  imports: [RouterLink, DatePipe, DecimalPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-detail.html',
  styleUrl: './session-detail.scss',
})
export class SessionDetailPage {
  /** :id from the URL */
  readonly id = input.required<string>();

  private readonly auth = inject(AuthStore);
  private readonly api = inject(SessionService);
  private readonly confirm = inject(ConfirmStore);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly session = signal<WorkoutSession | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  /** Sets grouped by exercise, in the order they were done */
  protected readonly groups = computed(() => {
    const map = new Map<number, { name: string; sets: WorkoutSessionSet[]; best: number }>();
    for (const set of this.session()?.sets ?? []) {
      const g = map.get(set.exerciseID) ?? { name: set.exerciseName, sets: [], best: 0 };
      g.sets.push(set);
      g.best = Math.max(g.best, set.weightKg ?? 0);
      map.set(set.exerciseID, g);
    }
    return [...map.values()];
  });

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.api.get(this.auth.userId(), id).subscribe({
      next: (s) => {
        this.session.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  protected async remove(): Promise<void> {
    const s = this.session();
    if (!s) return;
    const ok = await this.confirm.ask({
      title: 'Delete this workout?',
      message: `"${s.planName}" and its ${s.totalSets} sets will be removed from your history.`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.delete(this.auth.userId(), s.workoutSessionID).subscribe({
      next: () => {
        this.toast.success('Workout deleted');
        this.router.navigateByUrl('/history');
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
