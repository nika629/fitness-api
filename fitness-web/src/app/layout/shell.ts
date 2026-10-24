import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../core/auth.store';
import { ThemeStore } from '../core/theme.store';
import { Icon } from '../shared/icon';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

/** App frame for logged-in users: sidebar on desktop, bottom tabs + drawer on phones */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthStore);
  protected readonly theme = inject(ThemeStore);
  protected readonly drawerOpen = signal(false);

  protected readonly training: NavItem[] = [
    { path: '/', label: 'Today', icon: 'home', exact: true },
    { path: '/exercises', label: 'Exercises', icon: 'dumbbell' },
    { path: '/plans', label: 'Plans', icon: 'plans' },
    { path: '/favorites', label: 'Favorites', icon: 'heart' },
    { path: '/food', label: 'Food log', icon: 'food' },
  ];

  protected readonly admin: NavItem[] = [
    { path: '/admin/users', label: 'Users', icon: 'users' },
    { path: '/admin/exercises', label: 'Manage exercises', icon: 'dumbbell' },
    { path: '/admin/dictionary', label: 'Categories', icon: 'tag' },
  ];

  /** The four tabs that fit in the phone's bottom bar (+ "Menu") */
  protected readonly tabs: NavItem[] = [
    { path: '/', label: 'Today', icon: 'home', exact: true },
    { path: '/exercises', label: 'Exercises', icon: 'dumbbell' },
    { path: '/plans', label: 'Plans', icon: 'plans' },
    { path: '/food', label: 'Food', icon: 'food' },
  ];

  constructor() {
    // Close the phone drawer after navigating
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.drawerOpen.set(false));
  }

  protected initials(): string {
    return (this.auth.userName() || '?').trim().charAt(0).toUpperCase();
  }
}
