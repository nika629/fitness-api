import { Injectable, effect, signal } from '@angular/core';

type Theme = 'dark' | 'light';
const KEY = 'fitness.theme';

/** Dark / light theme, remembered in localStorage */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => {
      const theme = this.theme();
      document.documentElement.dataset['theme'] = theme;
      try {
        localStorage.setItem(KEY, theme);
      } catch {
        /* ignore */
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
