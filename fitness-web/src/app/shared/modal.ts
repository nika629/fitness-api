import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';
import { Icon } from './icon';

/**
 * Dialog window. Usage:
 *   @if (open()) { <app-modal title="New plan" (closed)="open.set(false)"> ...form... </app-modal> }
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="overlay" (click)="closed.emit()"></div>
    <section class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="title()" tabindex="-1">
      <header>
        <h2>{{ title() }}</h2>
        <button class="icon-btn" type="button" (click)="closed.emit()" aria-label="Close">
          <app-icon name="x" />
        </button>
      </header>
      <ng-content />
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 16px;
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: var(--overlay);
      backdrop-filter: blur(2px);
    }
    .dialog {
      position: relative;
      width: min(520px, 100%);
      max-height: calc(100dvh - 32px);
      overflow: auto;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--r-lg);
      padding: 20px;
      box-shadow: var(--shadow-pop);
      animation: pop 0.18s ease-out;
    }
    .dialog:focus { outline: none; }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    @keyframes pop {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
    }
    @media (max-width: 560px) {
      :host { align-items: end; padding: 0; }
      .dialog {
        width: 100%;
        border-radius: var(--r-lg) var(--r-lg) 0 0;
        padding-bottom: calc(20px + env(safe-area-inset-bottom));
      }
    }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly closed = output<void>();

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    afterNextRender(() => {
      const first = host.nativeElement.querySelector('input, select, textarea') as HTMLElement | null;
      (first ?? (host.nativeElement.querySelector('.dialog') as HTMLElement))?.focus();
    });
  }
}
