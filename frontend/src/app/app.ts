import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ShellComponent } from './shared/components/shell/shell.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

/**
 * Root application component.
 * Wraps authenticated routes in the app shell; hosts the single toast and confirm dialog.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShellComponent, ToastModule, ConfirmDialogModule],
  template: `
    @if (showShell) {
      <app-shell><router-outlet /></app-shell>
    } @else {
      <router-outlet />
    }
    <p-toast position="top-right" />
    <p-confirmdialog [style]="{ width: '26rem' }" />
  `,
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService); // Initialize theme service on app start

  showShell = false;

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((event: NavigationEnd) => {
        this.showShell = !event.urlAfterRedirects.startsWith('/auth') && this.authService.isAuthenticated();
      });
  }
}
