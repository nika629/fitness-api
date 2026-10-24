import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { AuthStore } from '../../core/auth.store';
import { ConfirmStore } from '../../core/confirm.store';
import { LookupsStore } from '../../core/lookups.store';
import { UserProfile } from '../../core/models';
import { ToastStore } from '../../core/toast.store';
import { UserService } from '../../core/user.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-admin-users-page',
  imports: [DatePipe, FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Users</h1>
          <p>Everyone with an account. Change a role here; the person sees the change after logging in again.</p>
        </div>
      </header>

      <dl class="stats">
        <div><dt>Accounts</dt><dd class="num">{{ users().length }}</dd></div>
        <div><dt>Admins</dt><dd class="num">{{ adminCount() }}</dd></div>
        <div><dt>New this month</dt><dd class="num">{{ newThisMonth() }}</dd></div>
      </dl>

      <div class="search">
        <app-icon name="search" [size]="18" />
        <input class="input" type="search" placeholder="Search by name or email" aria-label="Search users"
               [ngModel]="search()" (ngModelChange)="search.set($event)" />
      </div>

      @if (loading()) {
        <div class="skeleton" style="min-height: 260px"></div>
      } @else if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Role</th>
                <th><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (u of visible(); track u.userID) {
                <tr>
                  <td data-label="Name">
                    <strong>{{ u.userName }} {{ u.userLastName }}</strong>
                    @if (u.userID === me()) {
                      <span class="badge badge-blue">You</span>
                    }
                  </td>
                  <td data-label="Email" class="muted">{{ u.userEmail }}</td>
                  <td data-label="Joined" class="muted">{{ u.createdAt | date: 'd MMM y' }}</td>
                  <td data-label="Role">
                    <select class="select role" [attr.aria-label]="'Role of ' + u.userName"
                            [disabled]="u.userID === me()"
                            [ngModel]="roleIdOf(u)" (ngModelChange)="changeRole(u, $event)">
                      @for (r of lookups.roles(); track r.dictionaryID) {
                        <option [ngValue]="r.dictionaryID">{{ r.dictionaryCaption }}</option>
                      }
                    </select>
                  </td>
                  <td class="actions">
                    @if (u.userID !== me()) {
                      <button class="icon-btn danger" type="button" (click)="remove(u)" [attr.aria-label]="'Delete ' + u.userName">
                        <app-icon name="trash" [size]="18" />
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">No users match "{{ search() }}".</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 0;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--r-lg);
    }
    .stats div { padding: 16px 20px; }
    .stats div + div { border-left: 1px solid var(--line); }
    dt { color: var(--muted); font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
    dd { margin: 0; font-size: 2.4rem; }
    .search { position: relative; max-width: 420px; }
    .search app-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); }
    .search .input { padding-left: 40px; }
    .role { min-height: 34px; padding: 4px 10px; width: auto; min-width: 110px; }
    td strong { margin-right: 8px; }
  `,
})
export class AdminUsersPage {
  private readonly api = inject(UserService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);
  private readonly confirm = inject(ConfirmStore);
  protected readonly lookups = inject(LookupsStore);

  protected readonly users = signal<UserProfile[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly me = this.auth.userId;

  protected readonly visible = computed(() => {
    const t = this.search().trim().toLowerCase();
    return this.users().filter(
      (u) => !t || `${u.userName} ${u.userLastName} ${u.userEmail}`.toLowerCase().includes(t),
    );
  });
  protected readonly adminCount = computed(() => this.users().filter((u) => u.userRoleName === 'Admin').length);
  protected readonly newThisMonth = computed(() => {
    const now = new Date();
    return this.users().filter((u) => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  });

  constructor() {
    this.lookups.loadRoles();
    this.api.all().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected roleIdOf(u: UserProfile): number | null {
    return this.lookups.roles().find((r) => r.dictionaryCaption === u.userRoleName)?.dictionaryID ?? null;
  }

  protected changeRole(u: UserProfile, roleId: number): void {
    const role = this.lookups.roles().find((r) => r.dictionaryID === roleId);
    if (!role) return;
    this.api.assignRole(u.userID, roleId).subscribe({
      next: () => {
        this.users.update((list) => list.map((x) => (x.userID === u.userID ? { ...x, userRoleName: role.dictionaryCaption } : x)));
        this.toast.success(`${u.userName} is now ${role.dictionaryCaption}`);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.users.update((list) => [...list]); // put the old value back in the select
      },
    });
  }

  protected async remove(u: UserProfile): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${u.userName} ${u.userLastName}?`,
      message: 'Their plans, favorites and food log will be deleted too. This cannot be undone.',
      confirmText: 'Delete user',
    });
    if (!ok) return;
    this.api.delete(u.userID).subscribe({
      next: () => {
        this.users.update((list) => list.filter((x) => x.userID !== u.userID));
        this.toast.success(`${u.userName} deleted`);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
