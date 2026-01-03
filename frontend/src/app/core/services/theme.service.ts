import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Available theme modes.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Valid theme mode values.
 */
export const VALID_THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'] as const;

/**
 * Service for managing application theme (Light, Dark, System).
 * Handles PrimeNG dark mode class and persists preference to localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'lifesync_theme';
  private readonly DARK_MODE_CLASS = 'dark-mode';
  private platformId = inject(PLATFORM_ID);

  /** Signal holding current theme mode preference */
  private themeModeSignal = signal<ThemeMode>('system');

  /** Public readonly signal for current theme mode */
  readonly themeMode = this.themeModeSignal.asReadonly();

  /** Signal indicating if dark mode is currently active */
  private isDarkSignal = signal<boolean>(false);

  /** Public readonly signal for dark mode state */
  readonly isDark = this.isDarkSignal.asReadonly();

  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.loadTheme();
      this.setupSystemThemeListener();

      // Effect to apply theme changes
      effect(() => {
        const mode = this.themeModeSignal();
        this.applyTheme(mode);
      });
    }
  }

  /**
   * Loads theme preference from localStorage.
   */
  private loadTheme(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    if (stored && VALID_THEME_MODES.includes(stored)) {
      this.themeModeSignal.set(stored);
    } else {
      this.themeModeSignal.set('system');
    }
    this.applyTheme(this.themeModeSignal());
  }

  /**
   * Sets up listener for system theme changes.
   */
  private setupSystemThemeListener(): void {
    if (this.mediaQuery) {
      this.mediaQuery.addEventListener('change', (e) => {
        if (this.themeModeSignal() === 'system') {
          this.updateDarkMode(e.matches);
        }
      });
    }
  }

  /**
   * Applies the theme based on mode.
   * @param mode Theme mode to apply
   */
  private applyTheme(mode: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let isDark = false;

    switch (mode) {
      case 'dark':
        isDark = true;
        break;
      case 'light':
        isDark = false;
        break;
      case 'system':
        isDark = this.mediaQuery?.matches ?? false;
        break;
    }

    this.updateDarkMode(isDark);
  }

  /**
   * Updates the dark mode state and applies/removes CSS class.
   * @param isDark Whether dark mode should be active
   */
  private updateDarkMode(isDark: boolean): void {
    this.isDarkSignal.set(isDark);

    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add(this.DARK_MODE_CLASS);
    } else {
      htmlElement.classList.remove(this.DARK_MODE_CLASS);
    }
  }

  /**
   * Sets the theme mode.
   * @param mode Theme mode to set
   */
  setThemeMode(mode: ThemeMode): void {
    this.themeModeSignal.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, mode);
    }
  }

  /**
   * Gets theme mode options for display.
   */
  getThemeModeOptions(): { label: string; value: ThemeMode; icon: string }[] {
    return [
      { label: 'Light', value: 'light', icon: 'pi pi-sun' },
      { label: 'Dark', value: 'dark', icon: 'pi pi-moon' },
      { label: 'System', value: 'system', icon: 'pi pi-desktop' },
    ];
  }
}
