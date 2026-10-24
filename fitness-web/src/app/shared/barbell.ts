import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Macros } from '../core/models';

interface Plate {
  key: string;
  label: string;
  grams: number;
  color: string;
  height: number;
  share: number;
}

/**
 * The day's macros drawn as a loaded barbell:
 * protein = red plate, carbs = yellow plate, fat = green plate.
 * Plate height grows with the grams eaten.
 */
@Component({
  selector: 'app-barbell',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar-scene" role="img" [attr.aria-label]="summary()">
      <div class="side left">
        @for (p of platesReversed(); track p.key) {
          <span class="plate" [style.height.%]="p.height" [style.background]="p.color"></span>
        }
        <span class="collar"></span>
      </div>
      <div class="shaft"></div>
      <div class="side right">
        <span class="collar"></span>
        @for (p of plates(); track p.key) {
          <span class="plate" [style.height.%]="p.height" [style.background]="p.color"></span>
        }
      </div>
    </div>

    <dl class="legend">
      @for (p of plates(); track p.key) {
        <div>
          <dt><i [style.background]="p.color"></i>{{ p.label }}</dt>
          <dd>
            <span class="num">{{ p.grams | number: '1.0-1' }}</span> g
            <small class="muted">{{ p.share | number: '1.0-0' }}%</small>
          </dd>
        </div>
      }
    </dl>
  `,
  styles: `
    :host { display: grid; gap: 18px; }
    .bar-scene {
      position: relative;
      height: clamp(120px, 11vw, 176px);
      display: grid;
      grid-template-columns: 1fr minmax(60px, 34%) 1fr;
      align-items: center;
    }
    .shaft {
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(var(--steel), color-mix(in srgb, var(--steel) 70%, black));
    }
    .side {
      height: 100%;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .side::before {
      content: '';
      height: 10px;
      background: var(--steel);
      border-radius: 4px;
      flex: 1;
      order: 0;
    }
    .side.left { justify-content: flex-end; }
    .side.left::before { order: -1; }
    .side.right::before { order: 99; }
    .plate {
      width: clamp(14px, 2.2vw, 28px);
      min-height: 26%;
      border-radius: 5px;
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.18), inset 3px 0 0 rgb(255 255 255 / 0.12);
      transition: height 0.5s cubic-bezier(.2,.8,.2,1);
    }
    .collar {
      width: 10px;
      height: 30%;
      border-radius: 3px;
      background: var(--steel);
    }
    .legend {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin: 0;
    }
    .legend div { display: grid; gap: 2px; }
    dt { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 0.85rem; font-weight: 600; }
    dt i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    dd { margin: 0; }
    dd .num { font-size: clamp(1.4rem, 1rem + 1vw, 2rem); }
    dd small { margin-left: 4px; }
  `,
})
export class Barbell {
  readonly macros = input.required<Macros>();

  protected readonly plates = computed<Plate[]>(() => {
    const m = this.macros();
    const items = [
      { key: 'protein', label: 'Protein', grams: m.protein, color: 'var(--red)' },
      { key: 'carbs', label: 'Carbs', grams: m.carbohydrates, color: 'var(--yellow)' },
      { key: 'fat', label: 'Fat', grams: m.fat, color: 'var(--green)' },
    ];
    const total = items.reduce((s, i) => s + i.grams, 0);
    const max = Math.max(...items.map((i) => i.grams), 1);
    return items.map((i) => ({
      ...i,
      share: total ? (i.grams / total) * 100 : 0,
      // empty plate = small stub; heaviest plate = full height
      height: i.grams ? 34 + (i.grams / max) * 66 : 26,
    }));
  });

  protected readonly platesReversed = computed(() => [...this.plates()].reverse());

  protected readonly summary = computed(() => {
    const m = this.macros();
    return `Protein ${m.protein} g, carbs ${m.carbohydrates} g, fat ${m.fat} g`;
  });
}
