import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';

/** One exercise in a list: difficulty colour strip, name, tags, heart and "Add to plan" */
@Component({
  selector: 'app-exercise-card',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'diff-' + difficulty().toLowerCase()" },
  template: `
    <div class="body">
      <div class="title-row">
        <h3>{{ name() }}</h3>
        <button
          class="icon-btn heart"
          type="button"
          [class.on]="favorite()"
          [attr.aria-pressed]="favorite()"
          [attr.aria-label]="favorite() ? 'Remove ' + name() + ' from favorites' : 'Add ' + name() + ' to favorites'"
          (click)="toggleFavorite.emit()"
        >
          <app-icon name="heart" [filled]="favorite()" />
        </button>
      </div>
      <div class="tags">
        <span class="badge diff">{{ difficulty() }}</span>
        @if (muscle()) {
          <span class="badge">{{ muscle() }}</span>
        }
        @if (equipment()) {
          <span class="badge">{{ equipment() }}</span>
        }
      </div>
      @if (description()) {
        <p class="desc">{{ description() }}</p>
      }
    </div>
    <button class="btn btn-sm add" type="button" (click)="addToPlan.emit()">
      <app-icon name="plus" [size]="16" />
      Add to plan
    </button>
  `,
  styles: `
    :host {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 16px 16px 16px 20px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--r-lg);
      overflow: hidden;
    }
    /* coloured strip = difficulty, like a bumper plate */
    :host::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 5px;
      background: var(--diff, var(--steel));
    }
    .body { display: grid; gap: 8px; }
    .title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    h3 { font-size: 1.05rem; font-stretch: 106%; padding-top: 6px; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .diff { background: color-mix(in srgb, var(--diff, var(--steel)) 16%, transparent); color: var(--diff, var(--muted)); }
    .desc {
      color: var(--muted);
      font-size: 0.9rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .heart.on { color: var(--red); }
    .heart.on:hover { background: var(--red-soft); }
    .add { margin-top: auto; align-self: flex-start; }
  `,
})
export class ExerciseCard {
  readonly name = input.required<string>();
  readonly difficulty = input('');
  readonly muscle = input<string | null>(null);
  readonly equipment = input<string | null>(null);
  readonly description = input('');
  readonly favorite = input(false);

  readonly toggleFavorite = output<void>();
  readonly addToPlan = output<void>();
}
