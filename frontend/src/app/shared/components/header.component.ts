import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../core/services/auth.service';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Shared header component with navigation and timer status.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    MenuModule,
    AvatarModule,
    RippleModule
  ],
  template: `
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/dashboard" class="flex items-center">
              <i class="pi pi-clock text-2xl text-blue-600 mr-2"></i>
              <span class="text-xl font-bold text-gray-800 dark:text-gray-100">LifeSync</span>
            </a>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center space-x-4">
            <a 
              routerLink="/dashboard" 
              routerLinkActive="text-blue-600 bg-blue-50 dark:bg-blue-900/50" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <i class="pi pi-home mr-1"></i> Dashboard
            </a>
            <a 
              routerLink="/time-tracking" 
              routerLinkActive="text-blue-600 bg-blue-50 dark:bg-blue-900/50" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <i class="pi pi-clock mr-1"></i> Time Tracking
            </a>
            <a 
              routerLink="/finance" 
              routerLinkActive="text-blue-600 bg-blue-50 dark:bg-blue-900/50" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <i class="pi pi-dollar mr-1"></i> Finance
            </a>
            <a 
              routerLink="/settings" 
              routerLinkActive="text-blue-600 bg-blue-50 dark:bg-blue-900/50" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <i class="pi pi-cog mr-1"></i> Settings
            </a>
          </nav>

          <!-- Right side: Timer + User -->
          <div class="flex items-center space-x-4">
            <!-- Quick Timer Status -->
            @if (timeEntryService.isTimerRunning()) {
              <div class="hidden sm:flex items-center bg-blue-50 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                <div class="animate-pulse mr-2">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <span class="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {{ timeEntryService.formatElapsedTime(timeEntryService.elapsedSeconds()) }}
                </span>
              </div>
            }

            <!-- User Menu -->
            <div class="flex items-center">
              <p-avatar 
                [label]="authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U'" 
                shape="circle"
                styleClass="cursor-pointer"
                (click)="menu.toggle($event)"
              ></p-avatar>
              <p-menu #menu [popup]="true" [model]="menuItems"></p-menu>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div class="md:hidden border-t dark:border-gray-700">
        <div class="flex justify-around py-2">
          <a 
            routerLink="/dashboard" 
            routerLinkActive="text-blue-600" 
            class="flex flex-col items-center text-gray-600 dark:text-gray-300 text-xs"
          >
            <i class="pi pi-home text-lg"></i>
            <span>Dashboard</span>
          </a>
          <a 
            routerLink="/time-tracking" 
            routerLinkActive="text-blue-600" 
            class="flex flex-col items-center text-gray-600 dark:text-gray-300 text-xs"
          >
            <i class="pi pi-clock text-lg"></i>
            <span>Time</span>
          </a>
          <a 
            routerLink="/finance" 
            routerLinkActive="text-blue-600" 
            class="flex flex-col items-center text-gray-600 dark:text-gray-300 text-xs"
          >
            <i class="pi pi-dollar text-lg"></i>
            <span>Finance</span>
          </a>
          <a 
            routerLink="/settings" 
            routerLinkActive="text-blue-600" 
            class="flex flex-col items-center text-gray-600 dark:text-gray-300 text-xs"
          >
            <i class="pi pi-cog text-lg"></i>
            <span>Settings</span>
          </a>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  protected authService = inject(AuthService);
  protected timeEntryService = inject(TimeEntryService);
  protected themeService = inject(ThemeService);

  menuItems = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => {}
    },
    {
      separator: true
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => this.authService.logout()
    }
  ];
}
