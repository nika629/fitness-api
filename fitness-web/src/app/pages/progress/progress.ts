import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage, toDateKey } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { FoodService } from '../../core/food.service';
import { FoodLog, UserProfile, WeightLog, WorkoutSession } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { ToastStore } from '../../core/toast.store';
import { UserService } from '../../core/user.service';
import { WeightService } from '../../core/weight.service';
import { BarChart, BarDatum, LineChart, LinePoint } from '../../shared/charts';
import { Icon } from '../../shared/icon';

const DAY = 24 * 60 * 60 * 1000;

/** Charts: body weight over time, daily calories, workouts per week */
@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, DecimalPipe, BarChart, LineChart, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class ProgressPage {
  private readonly auth = inject(AuthStore);
  private readonly weightApi = inject(WeightService);
  private readonly toast = inject(ToastStore);

  protected readonly loading = signal(true);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly weights = signal<WeightLog[]>([]);
  private readonly food = signal<FoodLog[]>([]);
  private readonly sessions = signal<WorkoutSession[]>([]);

  protected readonly newWeight = signal<number | null>(null);
  protected readonly savingWeight = signal(false);

  // ----- body weight -----

  protected readonly weightPoints = computed<LinePoint[]>(() =>
    this.weights().map((w) => ({ date: new Date(w.loggedAt), value: w.weight })),
  );

  protected readonly weightStats = computed(() => {
    const list = this.weights();
    if (list.length === 0) return null;
    const first = list[0].weight;
    const last = list[list.length - 1].weight;
    return { first, last, change: Math.round((last - first) * 10) / 10 };
  });

  // ----- calories, last 14 days -----

  protected readonly calorieBars = computed<BarDatum[]>(() => {
    const byDay = new Map<string, number>();
    for (const log of this.food()) {
      const key = toDateKey(new Date(log.consumedAt));
      byDay.set(key, (byDay.get(key) ?? 0) + log.calories);
    }
    const today = startOfDay(new Date());
    const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
    const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
    return Array.from({ length: 14 }, (_, k) => {
      const d = new Date(today.getTime() - (13 - k) * DAY);
      const kcal = byDay.get(toDateKey(d)) ?? 0;
      return { label: short.format(d), value: kcal, tip: `${kcal.toLocaleString('en-US')} kcal · ${fmt.format(d)}` };
    });
  });

  /** Average over the days that have any food logged */
  protected readonly calorieAverage = computed(() => {
    const days = this.calorieBars().filter((b) => b.value > 0);
    return days.length ? Math.round(days.reduce((s, b) => s + b.value, 0) / days.length) : 0;
  });

  // ----- workouts per week, last 8 weeks -----

  protected readonly weekBars = computed<BarDatum[]>(() => {
    const thisMonday = startOfWeek(new Date());
    const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
    const weeks = Array.from({ length: 8 }, (_, k) => {
      const start = new Date(thisMonday.getTime() - (7 - k) * 7 * DAY);
      return { start, count: 0, minutes: 0 };
    });
    for (const s of this.sessions()) {
      const t = new Date(s.startedAt).getTime();
      const w = weeks.find((wk) => t >= wk.start.getTime() && t < wk.start.getTime() + 7 * DAY);
      if (w) {
        w.count++;
        w.minutes += s.durationMinutes;
      }
    }
    return weeks.map((w) => ({
      label: fmt.format(w.start),
      value: w.count,
      tip: `${w.count} ${w.count === 1 ? 'workout' : 'workouts'} · ${w.minutes} min · week of ${fmt.format(w.start)}`,
    }));
  });

  protected readonly hasWorkouts = computed(() => this.weekBars().some((b) => b.value > 0));

  protected readonly workoutsLast4Weeks = computed(() =>
    this.weekBars()
      .slice(-4)
      .reduce((n, b) => n + b.value, 0),
  );

  constructor() {
    const userId = this.auth.userId();
    forkJoin({
      profile: inject(UserService).me(),
      weights: this.weightApi.list(userId),
      food: inject(FoodService).list(userId),
      sessions: inject(SessionService).list(userId),
    }).subscribe({
      next: (r) => {
        this.profile.set(r.profile);
        this.weights.set(r.weights);
        this.food.set(r.food);
        this.sessions.set(r.sessions);
        this.newWeight.set(r.profile.currentWeight);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected setNewWeight(value: string): void {
    const n = Number(value);
    this.newWeight.set(value.trim() === '' || !Number.isFinite(n) ? null : n);
  }

  protected logWeight(): void {
    const w = this.newWeight();
    if (w == null || w < 20 || w > 400) {
      this.toast.error('Enter a weight between 20 and 400 kg.');
      return;
    }
    this.savingWeight.set(true);
    this.weightApi.create(this.auth.userId(), w).subscribe({
      next: (log) => {
        this.weights.update((list) =>
          [...list, log].sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()),
        );
        this.profile.update((p) => (p ? { ...p, currentWeight: w } : p));
        this.savingWeight.set(false);
        this.toast.success(`${w} kg logged`);
      },
      error: (err) => {
        this.savingWeight.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected abs(n: number): number {
    return Math.abs(n);
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday 00:00 of the week that contains d */
function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY);
}
