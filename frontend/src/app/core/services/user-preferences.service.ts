import { Injectable, signal, computed } from '@angular/core';
import { Currency } from '../models';

/**
 * User preferences interface.
 */
export interface UserPreferences {
  /** Preferred currency for display and new transactions */
  currency: Currency;
  /** User's timezone (IANA format, e.g., 'Europe/Belgrade') */
  timezone: string;
  /** Default time filter period in months (1, 3, 6, 12, or 0 for all time) */
  defaultFilterMonths: number;
}

/**
 * Default user preferences.
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  currency: Currency.USD,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultFilterMonths: 6,
};

/**
 * Service for managing user preferences.
 * Stores preferences in localStorage for persistence.
 */
@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private readonly STORAGE_KEY = 'lifesync_preferences';

  /** Signal holding current user preferences */
  private preferencesSignal = signal<UserPreferences>(DEFAULT_PREFERENCES);

  /** Computed signal to get current preferences */
  readonly preferences = computed(() => this.preferencesSignal());

  /** Computed signal to get current currency */
  readonly currency = computed(() => this.preferencesSignal().currency);

  /** Computed signal to get current timezone */
  readonly timezone = computed(() => this.preferencesSignal().timezone);

  /** Computed signal to get default filter months */
  readonly defaultFilterMonths = computed(() => this.preferencesSignal().defaultFilterMonths);

  constructor() {
    this.loadPreferences();
  }

  /**
   * Loads preferences from localStorage.
   */
  private loadPreferences(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        this.preferencesSignal.set({
          ...DEFAULT_PREFERENCES,
          ...parsed,
        });
      } catch (error) {
        console.warn('Failed to parse user preferences from localStorage, using defaults:', error);
        this.preferencesSignal.set(DEFAULT_PREFERENCES);
      }
    }
  }

  /**
   * Saves preferences to localStorage.
   */
  private savePreferences(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferencesSignal()));
  }

  /**
   * Updates user preferences.
   * @param updates Partial preferences to update
   */
  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferencesSignal.set({
      ...this.preferencesSignal(),
      ...updates,
    });
    this.savePreferences();
  }

  /**
   * Sets the preferred currency.
   * @param currency New currency preference
   */
  setCurrency(currency: Currency): void {
    this.updatePreferences({ currency });
  }

  /**
   * Sets the preferred timezone.
   * @param timezone IANA timezone string
   */
  setTimezone(timezone: string): void {
    this.updatePreferences({ timezone });
  }

  /**
   * Sets the default filter months.
   * @param months Number of months (0 for all time)
   */
  setDefaultFilterMonths(months: number): void {
    this.updatePreferences({ defaultFilterMonths: months });
  }

  /**
   * Resets preferences to defaults.
   */
  resetPreferences(): void {
    this.preferencesSignal.set(DEFAULT_PREFERENCES);
    this.savePreferences();
  }

  /**
   * Gets currency symbol for display.
   * @param currency Currency enum value
   */
  getCurrencySymbol(currency?: Currency): string {
    const curr = currency ?? this.currency();
    switch (curr) {
      case Currency.USD:
        return '$';
      case Currency.EUR:
        return '€';
      case Currency.RSD:
        return 'дин.';
      default:
        return '$';
    }
  }

  /**
   * Gets currency display name.
   * @param currency Currency enum value
   */
  getCurrencyName(currency?: Currency): string {
    const curr = currency ?? this.currency();
    switch (curr) {
      case Currency.USD:
        return 'US Dollar (USD)';
      case Currency.EUR:
        return 'Euro (EUR)';
      case Currency.RSD:
        return 'Serbian Dinar (RSD)';
      default:
        return 'US Dollar (USD)';
    }
  }

  /**
   * Formats an amount with the appropriate currency symbol.
   * @param amount The numeric amount
   * @param currency Optional currency override
   */
  formatCurrency(amount: number, currency?: Currency): string {
    const curr = currency ?? this.currency();
    switch (curr) {
      case Currency.USD:
        return `$${amount.toFixed(2)}`;
      case Currency.EUR:
        return `€${amount.toFixed(2)}`;
      case Currency.RSD:
        return `${amount.toFixed(2)} дин.`;
      default:
        return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Converts a Date to the user's timezone for display.
   * @param date The date to convert
   */
  formatDateInTimezone(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(undefined, { timeZone: this.timezone() });
  }

  /**
   * Gets list of common timezones.
   */
  getCommonTimezones(): { label: string; value: string }[] {
    return [
      { label: 'UTC', value: 'UTC' },
      { label: 'Europe/London (GMT)', value: 'Europe/London' },
      { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
      { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
      { label: 'Europe/Belgrade (CET)', value: 'Europe/Belgrade' },
      { label: 'Europe/Moscow (MSK)', value: 'Europe/Moscow' },
      { label: 'America/New_York (EST)', value: 'America/New_York' },
      { label: 'America/Chicago (CST)', value: 'America/Chicago' },
      { label: 'America/Denver (MST)', value: 'America/Denver' },
      { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
      { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
      { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
      { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
      { label: 'Australia/Sydney (AEDT)', value: 'Australia/Sydney' },
    ];
  }

  /**
   * Gets filter period options.
   */
  getFilterPeriodOptions(): { label: string; value: number }[] {
    return [
      { label: '1 Month', value: 1 },
      { label: '3 Months', value: 3 },
      { label: '6 Months', value: 6 },
      { label: '1 Year', value: 12 },
      { label: 'All Time', value: 0 },
    ];
  }

  /**
   * Gets a date range based on the filter period.
   * @param months Number of months (0 for all time)
   * @returns Start and end dates
   */
  getDateRangeForPeriod(months?: number): { startDate: Date | null; endDate: Date } {
    const period = months ?? this.defaultFilterMonths();
    const endDate = new Date();

    if (period === 0) {
      return { startDate: new Date(2000, 0, 1), endDate };
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - period);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }

  /**
   * Gets the current currency preference.
   */
  getCurrency(): Currency {
    return this.currency();
  }
}
