import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { TimeEntryService } from '../../../core/services/time-entry.service';
import { ThemeMode, ThemeService } from '../../../core/services/theme.service';

const COLLAPSE_KEY = 'lifesync_sidebar_collapsed';

/**
 * Authenticated app chrome: sidebar (desktop), top bar, bottom tab bar (mobile).
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MenuModule, TooltipModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected timer = inject(TimeEntryService);
  protected theme = inject(ThemeService);

  readonly nav = [
    { path: '/dashboard', label: 'Dashboard', short: 'Home', icon: 'pi-th-large' },
    { path: '/time-tracking', label: 'Time', short: 'Time', icon: 'pi-clock' },
    { path: '/finance', label: 'Finance', short: 'Finance', icon: 'pi-wallet' },
  ];

  readonly themeOptions: { value: ThemeMode; icon: string; label: string }[] = [
    { value: 'system', icon: 'pi-desktop', label: 'System theme' },
    { value: 'light', icon: 'pi-sun', label: 'Light theme' },
    { value: 'dark', icon: 'pi-moon', label: 'Dark theme' },
  ];

  readonly menuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/profile' },
    { label: 'Settings', icon: 'pi pi-sliders-h', routerLink: '/settings' },
    { separator: true },
    { label: 'Report an issue', icon: 'pi pi-github', url: 'https://github.com/Drashko73/LifeSyncTracker/issues', target: '_blank' },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
  ];

  protected collapsed = signal(this.readCollapsed());
  protected pageTitle = signal('');

  constructor() {
    this.updateTitle(); // the shell is created after the first navigation has already ended
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.updateTitle());
  }

  private updateTitle(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    this.pageTitle.set(route.title ?? '');
  }

  protected initial(): string {
    return this.auth.currentUser()?.username?.charAt(0).toUpperCase() || 'U';
  }

  /** "2:14" style short clock for the sidebar badge. */
  protected shortElapsed(): string {
    const s = this.timer.elapsedSeconds();
    return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`;
  }

  protected toggleCollapsed(): void {
    this.collapsed.update(v => !v);
    try { localStorage.setItem(COLLAPSE_KEY, this.collapsed() ? '1' : '0'); } catch { /* storage unavailable */ }
  }

  private readCollapsed(): boolean {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  }
}
