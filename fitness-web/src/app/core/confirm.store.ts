import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmText: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/** Shows the "Are you sure?" dialog and returns the answer as a Promise */
@Injectable({ providedIn: 'root' })
export class ConfirmStore {
  readonly request = signal<ConfirmRequest | null>(null);

  ask(options: { title: string; message: string; confirmText?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      this.request.set({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        danger: options.danger ?? true,
        resolve,
      });
    });
  }

  answer(ok: boolean): void {
    const req = this.request();
    this.request.set(null);
    req?.resolve(ok);
  }
}
