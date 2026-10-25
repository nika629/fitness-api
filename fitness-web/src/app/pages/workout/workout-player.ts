import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { ConfirmStore } from '../../core/confirm.store';
import { ExerciseService } from '../../core/exercise.service';
import { WorkoutPlan } from '../../core/models';
import { PlanService } from '../../core/plan.service';
import { SessionService } from '../../core/session.service';
import { ToastStore } from '../../core/toast.store';
import { Icon } from '../../shared/icon';

/** One set the user does (or still has to do) */
interface SetEntry {
  reps: number;
  weightKg: number | null;
  done: boolean;
}

/** One exercise of the plan, with its sets */
interface Block {
  exerciseID: number;
  name: string;
  targetReps: number;
  restTime: number;
  bodyweight: boolean;
  sets: SetEntry[];
}

interface Position {
  block: number;
  set: number;
}

/** What is kept in localStorage so a page refresh doesn't lose the workout */
interface SavedWorkout {
  planId: number;
  startedAt: number;
  blocks: Block[];
  current: Position;
}

type Phase = 'loading' | 'empty' | 'missing' | 'active' | 'summary';

const MAX_AGE_MS = 6 * 60 * 60 * 1000;

@Component({
  selector: 'app-workout-player-page',
  imports: [RouterLink, DecimalPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout-player.html',
  styleUrl: './workout-player.scss',
})
export class WorkoutPlayerPage {
  /** :planId from the URL */
  readonly planId = input.required<string>();

  private readonly auth = inject(AuthStore);
  private readonly plans = inject(PlanService);
  private readonly exercises = inject(ExerciseService);
  private readonly sessions = inject(SessionService);
  private readonly toast = inject(ToastStore);
  private readonly confirm = inject(ConfirmStore);
  private readonly router = inject(Router);

  protected readonly phase = signal<Phase>('loading');
  protected readonly plan = signal<WorkoutPlan | null>(null);
  protected readonly blocks = signal<Block[]>([]);
  protected readonly current = signal<Position>({ block: 0, set: 0 });
  protected readonly startedAt = signal(Date.now());
  /** Ticks every second; everything time-based is computed from it */
  protected readonly now = signal(Date.now());
  /** Rest countdown between sets */
  protected readonly rest = signal<{ endsAt: number; total: number } | null>(null);

  /** Values in the two inputs for the current set */
  protected readonly reps = signal(0);
  protected readonly weight = signal<number | null>(null);

  protected readonly notes = signal('');
  protected readonly saving = signal(false);

  // ----- derived values -----

  protected readonly block = computed(() => this.blocks()[this.current().block] ?? null);

  protected readonly totalSets = computed(() => this.blocks().reduce((n, b) => n + b.sets.length, 0));
  protected readonly doneSets = computed(() =>
    this.blocks().reduce((n, b) => n + b.sets.filter((s) => s.done).length, 0),
  );
  protected readonly progress = computed(() => (this.totalSets() ? (this.doneSets() / this.totalSets()) * 100 : 0));

  protected readonly volume = computed(() =>
    this.blocks().reduce(
      (kg, b) => kg + b.sets.filter((s) => s.done).reduce((v, s) => v + s.reps * (s.weightKg ?? 0), 0),
      0,
    ),
  );

  protected readonly elapsed = computed(() => formatClock(Math.max(0, this.now() - this.startedAt()) / 1000));
  protected readonly minutes = computed(() => Math.max(1, Math.round((this.now() - this.startedAt()) / 60000)));

  protected readonly restLeft = computed(() => {
    const r = this.rest();
    return r ? Math.max(0, Math.ceil((r.endsAt - this.now()) / 1000)) : 0;
  });

  /** 0..1 of the rest that is still left – drives the ring */
  protected readonly restRatio = computed(() => {
    const r = this.rest();
    return r ? Math.min(1, this.restLeft() / r.total) : 0;
  });

  protected readonly restLabel = computed(() => formatClock(this.restLeft()));

  /** Ring geometry for the rest timer */
  protected readonly ring = { r: 88, c: 2 * Math.PI * 88 };

  constructor() {
    const timer = setInterval(() => this.tick(), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Runs once the :planId input is set (and again if it changes)
    effect(() => {
      this.planId();
      untracked(() => this.load());
    });
  }

  private get userId() {
    return this.auth.userId();
  }

  private get id() {
    return Number(this.planId());
  }

  private get storageKey() {
    return `fitness.workout.${this.userId}`;
  }

  // ----- loading -----

  private load(): void {
    forkJoin({
      plan: this.plans.get(this.userId, this.id),
      items: this.plans.exercises(this.userId, this.id),
      catalog: this.exercises.list(),
    }).subscribe({
      next: ({ plan, items, catalog }) => {
        this.plan.set(plan);
        if (items.length === 0) {
          this.phase.set('empty');
          return;
        }

        const saved = this.readSaved();
        if (saved) {
          this.startedAt.set(saved.startedAt);
          this.blocks.set(saved.blocks);
          this.moveTo(saved.current);
          this.phase.set('active');
          return;
        }

        const equipment = new Map(catalog.map((e) => [e.exerciseID, e.equipmentName]));
        const blocks = [...items]
          .sort((a, b) => a.orderNumber - b.orderNumber)
          .map<Block>((i) => ({
            exerciseID: i.exerciseID,
            name: i.exerciseName,
            targetReps: i.reps,
            restTime: i.restTime,
            bodyweight: equipment.get(i.exerciseID) === 'Bodyweight',
            sets: Array.from({ length: Math.max(1, i.sets) }, () => ({ reps: i.reps, weightKg: null, done: false })),
          }));

        this.blocks.set(blocks);
        this.startedAt.set(Date.now());
        this.moveTo({ block: 0, set: 0 });
        this.phase.set('active');
        this.persist();
      },
      error: () => this.phase.set('missing'),
    });
  }

  // ----- the main action -----

  protected completeSet(): void {
    const pos = this.current();
    const block = this.block();
    if (!block) return;

    const reps = Math.max(0, Math.round(this.reps()));
    const weightKg = block.bodyweight ? null : this.weight();

    this.blocks.update((list) =>
      list.map((b, bi) =>
        bi !== pos.block
          ? b
          : { ...b, sets: b.sets.map((s, si) => (si === pos.set ? { reps, weightKg, done: true } : s)) },
      ),
    );

    const next = this.nextOpenSet(pos);
    if (!next) {
      this.rest.set(null);
      this.persist();
      this.phase.set('summary');
      return;
    }

    if (block.restTime > 0) {
      this.rest.set({ endsAt: Date.now() + block.restTime * 1000, total: block.restTime });
    }
    this.moveTo(next);
    this.persist();
  }

  /** Jump to an exercise from the list */
  protected jumpTo(blockIndex: number): void {
    const block = this.blocks()[blockIndex];
    if (!block) return;
    const open = block.sets.findIndex((s) => !s.done);
    this.rest.set(null);
    this.moveTo({ block: blockIndex, set: open === -1 ? block.sets.length - 1 : open });
    this.persist();
  }

  protected addRest(seconds: number): void {
    this.rest.update((r) => (r ? { endsAt: r.endsAt + seconds * 1000, total: r.total + seconds } : r));
  }

  protected skipRest(): void {
    this.rest.set(null);
  }

  protected stepReps(delta: number): void {
    this.reps.update((r) => Math.min(1000, Math.max(0, r + delta)));
  }

  protected stepWeight(delta: number): void {
    this.weight.update((w) => Math.min(1000, Math.max(0, Math.round(((w ?? 0) + delta) * 100) / 100)));
  }

  protected setReps(value: string): void {
    const n = Number(value);
    this.reps.set(Number.isFinite(n) ? Math.min(1000, Math.max(0, n)) : 0);
  }

  protected setWeight(value: string): void {
    if (value.trim() === '') {
      this.weight.set(null);
      return;
    }
    const n = Number(value);
    this.weight.set(Number.isFinite(n) ? Math.min(1000, Math.max(0, n)) : null);
  }

  // ----- finishing -----

  protected async finishEarly(): Promise<void> {
    if (this.doneSets() === 0) {
      const ok = await this.confirm.ask({
        title: 'Stop this workout?',
        message: "You haven't finished any sets yet, so nothing will be saved.",
        confirmText: 'Stop workout',
      });
      if (!ok) return;
      this.clearSaved();
      this.router.navigate(['/plans', this.id]);
      return;
    }
    this.rest.set(null);
    this.phase.set('summary');
  }

  protected backToWorkout(): void {
    const open = this.nextOpenSet({ block: 0, set: -1 });
    if (open) this.moveTo(open);
    this.phase.set('active');
  }

  protected async discard(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Discard this workout?',
      message: `${this.doneSets()} finished sets will be lost.`,
      confirmText: 'Discard',
    });
    if (!ok) return;
    this.clearSaved();
    this.router.navigate(['/plans', this.id]);
  }

  protected save(): void {
    const finishedAt = Date.now();
    const sets = this.blocks().flatMap((b) =>
      b.sets
        .filter((s) => s.done)
        .map((s, i) => ({ exerciseID: b.exerciseID, setNumber: i + 1, reps: s.reps, weightKg: s.weightKg })),
    );
    if (sets.length === 0) return;

    this.saving.set(true);
    this.sessions
      .create(this.userId, {
        workoutPlanID: this.id,
        // at least one minute, the API wants finish > start
        startedAt: new Date(Math.min(this.startedAt(), finishedAt - 60000)).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        notes: this.notes().trim() || null,
        sets,
      })
      .subscribe({
        next: (session) => {
          this.clearSaved();
          this.toast.success('Workout saved');
          this.router.navigate(['/history', session.workoutSessionID]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(errorMessage(err));
        },
      });
  }

  // ----- helpers -----

  protected isCurrent(bi: number, si: number): boolean {
    const c = this.current();
    return c.block === bi && c.set === si;
  }

  protected doneIn(block: Block): number {
    return block.sets.filter((s) => s.done).length;
  }

  protected nextLabel(): string {
    const b = this.block();
    return b ? `${b.name} · set ${this.current().set + 1} of ${b.sets.length}` : '';
  }

  private tick(): void {
    this.now.set(Date.now());
    const r = this.rest();
    if (r && r.endsAt <= Date.now()) {
      this.rest.set(null);
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        /* not supported */
      }
    }
  }

  /** Makes a set the current one and fills the inputs with sensible values */
  private moveTo(pos: Position): void {
    const block = this.blocks()[pos.block];
    if (!block) return;
    this.current.set(pos);
    const entry = block.sets[pos.set];
    // weight: this set's value, else the last weight used in this exercise
    const lastWeight = [...block.sets.slice(0, pos.set)].reverse().find((s) => s.done && s.weightKg != null)?.weightKg;
    this.reps.set(entry.done ? entry.reps : block.targetReps);
    this.weight.set(block.bodyweight ? null : (entry.weightKg ?? lastWeight ?? null));
  }

  /** The next set that is not done yet: same exercise first, then the following ones, then from the top */
  private nextOpenSet(from: Position): Position | null {
    const blocks = this.blocks();
    const order: Position[] = [];
    for (let bi = 0; bi < blocks.length; bi++) {
      for (let si = 0; si < blocks[bi].sets.length; si++) order.push({ block: bi, set: si });
    }
    const start = order.findIndex((p) => p.block === from.block && p.set === from.set);
    for (let k = 1; k <= order.length; k++) {
      const p = order[(start + k + order.length) % order.length];
      if (!blocks[p.block].sets[p.set].done) return p;
    }
    return null;
  }

  private persist(): void {
    const data: SavedWorkout = {
      planId: this.id,
      startedAt: this.startedAt(),
      blocks: this.blocks(),
      current: this.current(),
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      /* storage blocked – the workout still works, it just won't survive a refresh */
    }
  }

  private readSaved(): SavedWorkout | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw) as SavedWorkout;
      const fresh = Date.now() - data.startedAt < MAX_AGE_MS;
      return data.planId === this.id && fresh && data.blocks?.length ? data : null;
    } catch {
      return null;
    }
  }

  private clearSaved(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      /* ignore */
    }
  }
}

/** 75 -> "1:15", 3700 -> "1:01:40" */
function formatClock(totalSeconds: number): string {
  const t = Math.floor(totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
