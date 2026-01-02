import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

/**
 * Register component for new user registration.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <p-toast></p-toast>
      <p-card class="w-full max-w-md">
        <ng-template pTemplate="header">
          <div class="text-center pt-6">
            <h1 class="text-2xl font-bold text-gray-800">Create Account</h1>
            <p class="text-gray-500 mt-2">Start tracking your time and finances</p>
          </div>
        </ng-template>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="p-4">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input 
              pInputText 
              id="username" 
              formControlName="username"
              class="w-full"
              placeholder="Choose a username"
            />
            @if (registerForm.get('username')?.invalid && registerForm.get('username')?.touched) {
              <small class="text-red-500">Username must be at least 3 characters</small>
            }
          </div>

          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input 
              pInputText 
              id="email" 
              type="email"
              formControlName="email"
              class="w-full"
              placeholder="Enter your email"
            />
            @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
              <small class="text-red-500">Please enter a valid email</small>
            }
          </div>

          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <p-password 
              id="password" 
              formControlName="password"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
              placeholder="Create a password"
            ></p-password>
            @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
              <small class="text-red-500">Password must be at least 6 characters</small>
            }
          </div>

          <p-button 
            type="submit" 
            label="Create Account" 
            styleClass="w-full"
            [loading]="isLoading"
            [disabled]="registerForm.invalid || isLoading"
          ></p-button>
        </form>

        <ng-template pTemplate="footer">
          <div class="text-center pb-4">
            <p class="text-gray-500">
              Already have an account? 
              <a routerLink="/auth/login" class="text-blue-600 hover:underline font-medium">Sign in</a>
            </p>
          </div>
        </ng-template>
      </p-card>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  isLoading = false;

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * Handles form submission for registration.
   */
  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    const { username, email, password } = this.registerForm.value;

    this.authService.register({ 
      username: username!, 
      email: email!,
      password: password! 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Account created successfully!'
          });
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Registration failed. Please try again.'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
