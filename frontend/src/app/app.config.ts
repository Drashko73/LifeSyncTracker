import { ApplicationConfig, Injectable, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { provideRouter, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LifeSyncPreset } from './core/theme/lifesync-preset';

/** Browser tab title: "Finance · LifeSync". */
@Injectable({ providedIn: 'root' })
class AppTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · LifeSync` : 'LifeSync');
  }
}

/**
 * Application configuration with all required providers.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    // One toast + one confirm dialog live in the app shell; pages inject these root services.
    MessageService,
    ConfirmationService,
    providePrimeNG({
      translation: { firstDayOfWeek: 1 },
      theme: {
        preset: LifeSyncPreset,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, components, utilities' }
        }
      }
    })
  ]
};
