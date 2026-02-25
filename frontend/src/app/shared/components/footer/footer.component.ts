import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared footer component with copyright and GitHub link.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
