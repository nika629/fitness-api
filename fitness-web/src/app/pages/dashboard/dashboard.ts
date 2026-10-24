import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toDateKey } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { FavoritesStore } from '../../core/favorites.store';
import { FoodService, sumMacros } from '../../core/food.service';
import { FoodLog, UserProfile, WorkoutPlan } from '../../core/models';
import { PlanService } from '../../core/plan.service';
import { UserService } from '../../core/user.service';
import { Barbell } from '../../shared/barbell';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, DatePipe, DecimalPipe, Barbell, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  protected readonly auth = inject(AuthStore);
  protected readonly favorites = inject(FavoritesStore);
  private readonly food = inject(FoodService);
  private readonly plansApi = inject(PlanService);
  private readonly users = inject(UserService);

  protected readonly today = new Date();
  protected readonly loading = signal(true);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly plans = signal<WorkoutPlan[]>([]);
  private readonly logs = signal<FoodLog[]>([]);

  protected readonly todayLogs = computed(() => {
    const key = toDateKey(this.today);
    return this.logs().filter((l) => toDateKey(new Date(l.consumedAt)) === key);
  });
  protected readonly totals = computed(() => sumMacros(this.todayLogs()));

  /** kg left to reach the goal weight (negative = above goal) */
  protected readonly toGo = computed(() => {
    const p = this.profile();
    if (!p?.currentWeight || !p.goalWeight) return null;
    return Math.round((p.currentWeight - p.goalWeight) * 10) / 10;
  });

  /** Scale ruler: a kg range around "now" and "goal", with both positions in % */
  protected readonly ruler = computed(() => {
    const p = this.profile();
    if (!p?.currentWeight || !p.goalWeight) return null;
    const lo = Math.floor(Math.min(p.currentWeight, p.goalWeight) - 3);
    const hi = Math.ceil(Math.max(p.currentWeight, p.goalWeight) + 3);
    const pos = (kg: number) => ((kg - lo) / (hi - lo)) * 100;
    const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => ({ kg: lo + i, left: pos(lo + i), major: (lo + i) % 5 === 0 }));
    return { lo, hi, now: pos(p.currentWeight), goal: pos(p.goalWeight), ticks };
  });

  /** Body-mass index from height (cm) and current weight (kg) */
  protected readonly bmi = computed(() => {
    const p = this.profile();
    if (!p?.height || !p.currentWeight) return null;
    const m = p.height / 100;
    return Math.round((p.currentWeight / (m * m)) * 10) / 10;
  });

  protected readonly greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  constructor() {
    const userId = this.auth.userId();
    this.favorites.load();

    let pending = 3;
    const done = () => --pending === 0 && this.loading.set(false);

    this.users.me().subscribe({ next: (p) => this.profile.set(p), complete: done, error: done });
    this.plansApi.list(userId).subscribe({ next: (p) => this.plans.set(p), complete: done, error: done });
    this.food.list(userId).subscribe({ next: (l) => this.logs.set(l), complete: done, error: done });
  }

  protected abs(n: number): number {
    return Math.abs(n);
  }
}
