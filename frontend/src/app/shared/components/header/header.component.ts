import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../core/services/auth.service';
import { TimeEntryService } from '../../../core/services/time-entry.service';
import { ThemeService } from '../../../core/services/theme.service';

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
  templateUrl: './header.component.html',
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
