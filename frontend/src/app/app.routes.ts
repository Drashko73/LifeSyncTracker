import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

/**
 * Application routes with lazy loading for feature modules.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        title: 'Sign in',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [noAuthGuard]
      },
      {
        path: 'register',
        title: 'Create account',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [noAuthGuard]
      }
    ]
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'time-tracking',
    title: 'Time',
    loadComponent: () => import('./features/time-tracking/time-tracking.component').then(m => m.TimeTrackingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'finance',
    title: 'Finance',
    loadComponent: () => import('./features/finance/finance.component').then(m => m.FinanceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    title: 'Profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    title: 'Settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
