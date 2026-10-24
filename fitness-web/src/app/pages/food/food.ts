import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { errorMessage, toDateKey } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { ConfirmStore } from '../../core/confirm.store';
import { FoodService, sumMacros } from '../../core/food.service';
import { FoodLog } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { Barbell } from '../../shared/barbell';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-food-page',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, Barbell, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './food.html',
  styleUrl: './food.scss',
})
export class FoodPage {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(FoodService);
  private readonly toast = inject(ToastStore);
  private readonly confirm = inject(ConfirmStore);

  protected readonly logs = signal<FoodLog[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  /** The day being viewed (local date) */
  protected readonly day = signal(startOfDay(new Date()));
  protected readonly isToday = computed(() => toDateKey(this.day()) === toDateKey(new Date()));

  protected readonly dayLogs = computed(() => {
    const key = toDateKey(this.day());
    return this.logs()
      .filter((l) => toDateKey(new Date(l.consumedAt)) === key)
      .sort((a, b) => b.consumedAt.localeCompare(a.consumedAt));
  });
  protected readonly totals = computed(() => sumMacros(this.dayLogs()));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    foodName: ['', [Validators.required, Validators.maxLength(100)]],
    calories: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
    protein: [0, [Validators.min(0), Validators.max(1000)]],
    carbohydrates: [0, [Validators.min(0), Validators.max(1000)]],
    fat: [0, [Validators.min(0), Validators.max(1000)]],
    time: [currentTime()],
  });

  constructor() {
    this.api.list(this.auth.userId()).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected shiftDay(days: number): void {
    const d = new Date(this.day());
    d.setDate(d.getDate() + days);
    this.day.set(startOfDay(d));
  }

  protected goToday(): void {
    this.day.set(startOfDay(new Date()));
  }

  protected add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Enter a food name and calories (0 or more).');
      return;
    }
    const v = this.form.getRawValue();
    // date of the viewed day + the time from the form, sent as UTC
    const [h, m] = (v.time || currentTime()).split(':').map(Number);
    const consumed = new Date(this.day());
    consumed.setHours(h || 0, m || 0, 0, 0);

    this.saving.set(true);
    this.formError.set('');
    this.api
      .create(this.auth.userId(), {
        foodName: v.foodName.trim(),
        calories: Number(v.calories) || 0,
        protein: Number(v.protein) || 0,
        carbohydrates: Number(v.carbohydrates) || 0,
        fat: Number(v.fat) || 0,
        consumedAt: consumed.toISOString(),
      })
      .subscribe({
        next: (log) => {
          this.logs.update((list) => [log, ...list]);
          this.toast.success(`${log.foodName} logged`);
          this.form.reset({ foodName: '', calories: 0, protein: 0, carbohydrates: 0, fat: 0, time: currentTime() });
          this.saving.set(false);
        },
        error: (err) => {
          this.formError.set(errorMessage(err));
          this.saving.set(false);
        },
      });
  }

  protected async remove(log: FoodLog): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete entry?',
      message: `Remove ${log.foodName} (${log.calories} kcal) from your log?`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.delete(this.auth.userId(), log.foodLogID).subscribe({
      next: () => {
        this.logs.update((list) => list.filter((l) => l.foodLogID !== log.foodLogID));
        this.toast.success(`${log.foodName} deleted`);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function currentTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
