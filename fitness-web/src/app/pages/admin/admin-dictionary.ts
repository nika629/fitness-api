import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { LookupsStore } from '../../core/lookups.store';
import { DictionaryGroup, DictionaryItem } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { Icon } from '../../shared/icon';

interface Column {
  code: number;
  title: string;
  hint: string;
  placeholder: string;
}

@Component({
  selector: 'app-admin-dictionary-page',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Categories</h1>
          <p>The lists used to describe exercises. New items show up in filters and forms right away.</p>
        </div>
      </header>

      <div class="grid-2">
        @for (col of columns; track col.code) {
          <section class="panel" [attr.aria-labelledby]="'col-' + col.code">
            <div class="panel-head">
              <h2 [id]="'col-' + col.code">{{ col.title }}</h2>
              <span class="badge">{{ items(col.code).length }}</span>
            </div>
            <p class="muted hint">{{ col.hint }}</p>

            <ul class="items">
              @for (item of items(col.code); track item.dictionaryID) {
                <li>{{ item.dictionaryCaption }}</li>
              }
            </ul>

            <form class="add" (ngSubmit)="add(col)">
              <input class="input" [name]="'new-' + col.code" [placeholder]="col.placeholder" [attr.aria-label]="'New ' + col.title"
                     [ngModel]="drafts()[col.code]" (ngModelChange)="setDraft(col.code, $event)" />
              <button class="btn btn-primary" type="submit" [disabled]="busy() === col.code">
                <app-icon name="plus" [size]="18" /> Add
              </button>
            </form>
          </section>
        }
      </div>
    </div>
  `,
  styles: `
    .hint { margin: -6px 0 14px; font-size: 0.9rem; }
    .items {
      list-style: none;
      margin: 0 0 16px;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .items li {
      padding: 6px 12px;
      border-radius: var(--r-pill);
      background: var(--surface-2);
      border: 1px solid var(--line);
      font-weight: 600;
      font-size: 0.9rem;
    }
    .add { display: flex; gap: 10px; }
    .add .input { flex: 1; }
  `,
})
export class AdminDictionaryPage {
  private readonly lookups = inject(LookupsStore);
  private readonly toast = inject(ToastStore);

  protected readonly columns: Column[] = [
    { code: DictionaryGroup.MuscleGroups, title: 'Muscle groups', hint: 'Used for the filter chips in the exercise catalog.', placeholder: 'e.g. Glutes' },
    { code: DictionaryGroup.Equipment, title: 'Equipment', hint: 'What an exercise needs: a barbell, a machine, nothing at all.', placeholder: 'e.g. TRX straps' },
  ];

  protected readonly drafts = signal<Record<number, string>>({ 2: '', 3: '' });
  protected readonly busy = signal<number | null>(null);

  constructor() {
    this.lookups.load(true);
  }

  protected items(code: number): DictionaryItem[] {
    return code === DictionaryGroup.Equipment ? this.lookups.equipment() : this.lookups.muscleGroups();
  }

  protected setDraft(code: number, value: string): void {
    this.drafts.update((d) => ({ ...d, [code]: value }));
  }

  protected add(col: Column): void {
    const caption = (this.drafts()[col.code] ?? '').trim();
    if (!caption) {
      this.toast.error(`Type a name for the new ${col.title.toLowerCase().replace(/s$/, '')}.`);
      return;
    }
    this.busy.set(col.code);
    this.lookups.create(col.code, caption).subscribe({
      next: (item) => {
        this.setDraft(col.code, '');
        this.toast.success(`${item.dictionaryCaption} added`);
        this.busy.set(null);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.busy.set(null);
      },
    });
  }
}
