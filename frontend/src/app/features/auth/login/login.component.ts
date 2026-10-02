import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Login component for user authentication.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  error = signal('');

  loginForm = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.error.set('');
    const { usernameOrEmail, password } = this.loginForm.value;
    this.authService.login({ usernameOrEmail: usernameOrEmail!, password: password! }).subscribe({
      next: response => {
        if (response.success) this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      },
      error: error => {
        this.isLoading.set(false);
        this.error.set(error.error?.message || 'Sign-in failed. Check your details and try again.');
      },
    });
  }
}
