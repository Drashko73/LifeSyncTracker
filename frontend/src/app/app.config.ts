import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LifeSyncPreset } from './core/theme/lifesync-preset';

/**
 * Application configuration with all required providers.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    // One toast + one confirm dialog live in the app shell; pages inject these root services.
    MessageService,
    ConfirmationService,
    providePrimeNG({
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
