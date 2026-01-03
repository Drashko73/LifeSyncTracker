import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

/**
 * Root application component.
 * Shows header for authenticated routes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    @if (showHeader) {
      <app-header></app-header>
    }
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 64px);
    }
  `]
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService); // Initialize theme service on app start
  
  showHeader = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Show header for all routes except auth routes
      this.showHeader = !event.url.startsWith('/auth') && this.authService.isAuthenticated();
    });
  }
}
