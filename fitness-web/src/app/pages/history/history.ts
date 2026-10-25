import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth.store';
import { WorkoutSession } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { Icon } from '../../shared/icon';

/** All finished workouts, newest first, grouped by month */
@Component({
  selector: 'app-history-page',
  imports: [RouterLink, DatePipe, DecimalPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class HistoryPage {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(SessionService);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly sessions = signal<WorkoutSession[]>([]);

  protected readonly months = computed(() => {
    const groups = new Map<string, WorkoutSession[]>();
    for (const s of this.sessions()) {
      const d = new Date(s.startedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    return [...groups.values()].map((items) => ({ date: items[0].startedAt, items }));
  });

  protected readonly thisMonth = computed(() => {
    const now = new Date();
    return this.sessions().filter((s) => {
      const d = new Date(s.startedAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  });

  protected readonly totalHours = computed(
    () => Math.round((this.sessions().reduce((m, s) => m + s.durationMinutes, 0) / 60) * 10) / 10,
  );

  protected readonly totalTonnes = computed(
    () => Math.round(this.sessions().reduce((kg, s) => kg + s.totalVolumeKg, 0) / 100) / 10,
  );

  constructor() {
    this.api.list(this.auth.userId()).subscribe({
      next: (list) => {
        this.sessions.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
