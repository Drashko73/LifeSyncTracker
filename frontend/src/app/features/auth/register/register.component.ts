import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Register component for creating a new account.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  error = signal('');

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.error.set('');
    const { username, email, password } = this.registerForm.value;
    this.authService.register({ username: username!, email: email!, password: password! }).subscribe({
      next: response => {
        this.isLoading.set(false);
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Welcome to LifeSync', detail: 'Your account is ready.' });
          this.router.navigate(['/dashboard']);
        }
      },
      error: error => {
        this.isLoading.set(false);
        this.error.set(error.error?.message || 'Could not create your account. Try again.');
      },
    });
  }
}
