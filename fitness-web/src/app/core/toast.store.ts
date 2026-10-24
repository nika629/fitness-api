import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'success' | 'error';
}

/** Short messages in the corner: "Plan created", "Wrong password", ... */
@Injectable({ providedIn: 'root' })
export class ToastStore {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(text: string): void {
    this.push(text, 'success');
  }

  error(text: string): void {
    this.push(text, 'error');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(text: string, kind: Toast['kind']): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list.slice(-2), { id, text, kind }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 6000 : 3500);
  }
}
