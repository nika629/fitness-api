import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmStore } from '../core/confirm.store';
import { Modal } from './modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.request(); as req) {
      <app-modal [title]="req.title" (closed)="store.answer(false)">
        <p class="muted">{{ req.message }}</p>
        <div class="form-actions" style="margin-top: 20px">
          <button class="btn" type="button" (click)="store.answer(false)">Cancel</button>
          <button
            class="btn"
            [class.btn-danger-solid]="req.danger"
            [class.btn-primary]="!req.danger"
            type="button"
            (click)="store.answer(true)"
          >
            {{ req.confirmText }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class ConfirmDialog {
  protected readonly store = inject(ConfirmStore);
}
