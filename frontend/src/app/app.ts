import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

/**
 * Root application component.
 * Shows header and footer for authenticated routes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="flex flex-col min-h-screen">
      @if (showHeader) {
        <app-header></app-header>
      }
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
      @if (showHeader) {
        <app-footer></app-footer>
      }
    </div>
  `,
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
