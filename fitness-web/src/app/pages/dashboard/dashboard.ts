import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toDateKey } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { FavoritesStore } from '../../core/favorites.store';
import { FoodService, sumMacros } from '../../core/food.service';
import { Exercise, FoodLog, UserProfile, WorkoutExercise, WorkoutPlan, WorkoutSession } from '../../core/models';
import { ExerciseService } from '../../core/exercise.service';
import { PlanService } from '../../core/plan.service';
import { SessionService } from '../../core/session.service';
import { UserService } from '../../core/user.service';
import { Barbell } from '../../shared/barbell';
import { GymView, UpNext } from '../../shared/gym/gym-view';
import { zoneForEquipment } from '../../shared/gym/gym-zones';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, DatePipe, DecimalPipe, Barbell, GymView, Icon],
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
  private readonly sessionsApi = inject(SessionService);
  private readonly exercisesApi = inject(ExerciseService);

  protected readonly today = new Date();
  protected readonly loading = signal(true);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly plans = signal<WorkoutPlan[]>([]);
  private readonly logs = signal<FoodLog[]>([]);
  private readonly sessions = signal<WorkoutSession[]>([]);

  protected readonly exercises = signal<Exercise[]>([]);
  private readonly nextItems = signal<WorkoutExercise[]>([]);

  /** The plan trained longest ago (or never) – that's the one to do next */
  private readonly nextPlan = computed(() => {
    const lastDone = new Map<number, number>();
    for (const s of this.sessions()) {
      if (s.workoutPlanID == null) continue;
      const t = new Date(s.startedAt).getTime();
      lastDone.set(s.workoutPlanID, Math.max(lastDone.get(s.workoutPlanID) ?? 0, t));
    }
    const candidates = this.plans().filter((p) => p.exerciseCount > 0);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, p) =>
      (lastDone.get(p.workoutPlanID) ?? 0) < (lastDone.get(best.workoutPlanID) ?? 0) ? p : best,
    );
  });

  /** Next plan + the gym zones its exercises use, for the 3D gym */
  protected readonly upNext = computed<UpNext | null>(() => {
    const plan = this.nextPlan();
    if (!plan) return null;
    const equipment = new Map(this.exercises().map((e) => [e.exerciseID, e.equipmentName]));
    const exerciseIds = this.nextItems().map((i) => i.exerciseID);
    const zoneKeys = [...new Set(exerciseIds.map((id) => zoneForEquipment(equipment.get(id))).filter((k): k is string => !!k))];
    return { plan, exerciseIds, zoneKeys };
  });

  /** The last three finished workouts */
  protected readonly recent = computed(() => this.sessions().slice(0, 3));

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

    let pending = 4;
    const done = () => --pending === 0 && this.loading.set(false);

    this.users.me().subscribe({ next: (p) => this.profile.set(p), complete: done, error: done });
    this.plansApi.list(userId).subscribe({ next: (p) => this.plans.set(p), complete: done, error: done });
    this.food.list(userId).subscribe({ next: (l) => this.logs.set(l), complete: done, error: done });
    this.sessionsApi.list(userId).subscribe({ next: (s) => this.sessions.set(s), complete: done, error: done });
    this.exercisesApi.list().subscribe({ next: (list) => this.exercises.set(list) });

    // load the exercises of the next plan whenever it changes
    effect(() => {
      const plan = this.nextPlan();
      untracked(() => {
        if (!plan) {
          this.nextItems.set([]);
          return;
        }
        this.plansApi.exercises(userId, plan.workoutPlanID).subscribe({ next: (items) => this.nextItems.set(items) });
      });
    });
  }

  protected abs(n: number): number {
    return Math.abs(n);
  }
}
