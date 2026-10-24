import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  // Public pages
  { path: 'login', canActivate: [guestGuard], title: 'Log in · Fitness', loadComponent: () => import('./pages/auth/login').then((m) => m.LoginPage) },
  { path: 'register', canActivate: [guestGuard], title: 'Create account · Fitness', loadComponent: () => import('./pages/auth/register').then((m) => m.RegisterPage) },

  // Logged-in area (User + Admin)
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', title: 'Today · Fitness', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'exercises', title: 'Exercises · Fitness', loadComponent: () => import('./pages/exercises/exercises').then((m) => m.ExercisesPage) },
      { path: 'plans', title: 'Plans · Fitness', loadComponent: () => import('./pages/plans/plans').then((m) => m.PlansPage) },
      { path: 'plans/:id', title: 'Plan · Fitness', loadComponent: () => import('./pages/plans/plan-detail').then((m) => m.PlanDetailPage) },
      { path: 'favorites', title: 'Favorites · Fitness', loadComponent: () => import('./pages/favorites/favorites').then((m) => m.FavoritesPage) },
      { path: 'food', title: 'Food log · Fitness', loadComponent: () => import('./pages/food/food').then((m) => m.FoodPage) },
      { path: 'profile', title: 'Profile · Fitness', loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage) },

      // Admin only
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          { path: 'users', title: 'Users · Admin', loadComponent: () => import('./pages/admin/admin-users').then((m) => m.AdminUsersPage) },
          { path: 'exercises', title: 'Manage exercises · Admin', loadComponent: () => import('./pages/admin/admin-exercises').then((m) => m.AdminExercisesPage) },
          { path: 'dictionary', title: 'Categories · Admin', loadComponent: () => import('./pages/admin/admin-dictionary').then((m) => m.AdminDictionaryPage) },
        ],
      },
    ],
  },

  { path: '**', title: 'Not found · Fitness', loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage) },
];
