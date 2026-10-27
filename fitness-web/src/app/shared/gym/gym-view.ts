import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../../core/api';
import { FavoritesStore } from '../../core/favorites.store';
import { Exercise, WorkoutPlan } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { AddToPlan } from '../add-to-plan';
import { Icon } from '../icon';
import type { GymWorld } from './gym-world';
import { GYM_ZONES, GymZone, zoneForEquipment } from './gym-zones';

/** The plan the user should do next, and the gym zones its exercises use */
export interface UpNext {
  plan: WorkoutPlan;
  exerciseIds: number[];
  zoneKeys: string[];
}

/**
 * Interactive 3D gym on the Today page.
 * three.js is loaded lazily (dynamic import) the first time this component renders,
 * so the rest of the app doesn't get heavier.
 */
@Component({
  selector: 'app-gym-view',
  imports: [RouterLink, AddToPlan, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gym-view.html',
  styleUrl: './gym-view.scss',
  host: { '(document:keydown.escape)': 'close()' },
})
export class GymView {
  /** Exercise catalog from the API (equipment name decides the zone) */
  readonly exercises = input<Exercise[]>([]);
  readonly upNext = input<UpNext | null>(null);

  protected readonly favorites = inject(FavoritesStore);
  private readonly toast = inject(ToastStore);

  protected readonly zones = GYM_ZONES;
  protected readonly selected = signal<string | null>(null);
  protected readonly status = signal<'loading' | 'ready' | 'failed'>('loading');
  protected readonly autoRotate = signal(false);
  protected readonly touched = signal(false);
  protected readonly adding = signal<Exercise | null>(null);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly pins = viewChildren<ElementRef<HTMLButtonElement>>('pin');
  private readonly world = signal<GymWorld | null>(null);

  /** Exercises grouped by zone key */
  protected readonly byZone = computed(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of this.exercises()) {
      const key = zoneForEquipment(e.equipmentName);
      if (key) map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  });

  protected readonly zone = computed<GymZone | null>(() => this.zones.find((z) => z.key === this.selected()) ?? null);
  protected readonly zoneExercises = computed(() => this.byZone().get(this.selected() ?? '') ?? []);
  protected readonly nextZones = computed(() => {
    const keys = new Set(this.upNext()?.zoneKeys ?? []);
    return this.zones.filter((z) => keys.has(z.key));
  });
  private readonly nextIds = computed(() => new Set(this.upNext()?.exerciseIds ?? []));

  constructor() {
    const destroyRef = inject(DestroyRef);
    let destroyed = false;
    destroyRef.onDestroy(() => {
      destroyed = true;
      this.world()?.dispose();
    });

    afterNextRender(async () => {
      try {
        const { GymWorld } = await import('./gym-world');
        if (destroyed) return;
        const world = new GymWorld(this.canvas().nativeElement, this.stage().nativeElement, {
          reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          onHover: () => {},
          onSelect: (key) => (key ? this.open(key) : this.close()),
          onFrame: (positions) => this.movePins(positions),
        });
        this.world.set(world);
        this.status.set('ready');
      } catch {
        // no WebGL (very old browser or disabled graphics): the cards below still work
        this.status.set('failed');
      }
    });

    // rings under the zones of the next plan
    effect(() => this.world()?.setHighlighted(this.upNext()?.zoneKeys ?? []));
  }

  protected count(key: string): number {
    return this.byZone().get(key)?.length ?? 0;
  }

  protected isNext(exerciseId: number): boolean {
    return this.nextIds().has(exerciseId);
  }

  protected open(key: string): void {
    this.selected.set(key);
    this.touched.set(true);
    this.world()?.focusZone(key, true);
  }

  protected close(): void {
    if (!this.selected()) return;
    this.selected.set(null);
    this.world()?.clearFocus();
  }

  protected reset(): void {
    this.selected.set(null);
    this.world()?.resetView();
  }

  protected toggleRotate(): void {
    this.autoRotate.update((on) => !on);
    this.world()?.setAutoRotate(this.autoRotate());
  }

  protected toggleFavorite(e: Exercise): void {
    const on = this.favorites.isFavorite(e.exerciseID);
    const request: Observable<unknown> = on ? this.favorites.remove(e.exerciseID) : this.favorites.add(e.exerciseID);
    request.subscribe({
      next: () => this.toast.success(on ? `${e.exerciseName} removed from favorites` : `${e.exerciseName} added to favorites`),
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  /** Runs every frame: moves the HTML pins over their zones without Angular change detection */
  private movePins(positions: { key: string; x: number; y: number; visible: boolean }[]): void {
    const pins = this.pins();
    positions.forEach((p, i) => {
      const el = pins[i]?.nativeElement;
      if (!el) return;
      el.style.transform = `translate(${p.x}px, ${p.y - 14}px) translate(-50%, -100%)`;
      el.classList.toggle('off', !p.visible);
    });
  }
}
