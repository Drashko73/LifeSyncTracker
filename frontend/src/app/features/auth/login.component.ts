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
 * Login component for user authentication.
 */
@Component({
  selector: 'app-login',
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
            <h1 class="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p class="text-gray-500 mt-2">Sign in to your LifeSync Tracker account</p>
          </div>
        </ng-template>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="p-4">
          <div class="mb-4">
            <label for="usernameOrEmail" class="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input 
              pInputText 
              id="usernameOrEmail" 
              formControlName="usernameOrEmail"
              class="w-full"
              placeholder="Enter your username or email"
            />
            @if (loginForm.get('usernameOrEmail')?.invalid && loginForm.get('usernameOrEmail')?.touched) {
              <small class="text-red-500">Username or email is required</small>
            }
          </div>

          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <p-password 
              id="password" 
              formControlName="password"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
              placeholder="Enter your password"
            ></p-password>
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <small class="text-red-500">Password is required</small>
            }
          </div>

          <p-button 
            type="submit" 
            label="Sign In" 
            styleClass="w-full"
            [loading]="isLoading"
            [disabled]="loginForm.invalid || isLoading"
          ></p-button>
        </form>

        <ng-template pTemplate="footer">
          <div class="text-center pb-4">
            <p class="text-gray-500">
              Don't have an account? 
              <a routerLink="/auth/register" class="text-blue-600 hover:underline font-medium">Sign up</a>
            </p>
          </div>
        </ng-template>
      </p-card>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  isLoading = false;

  loginForm = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required]
  });

  /**
   * Handles form submission for login.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { usernameOrEmail, password } = this.loginForm.value;

    this.authService.login({ 
      usernameOrEmail: usernameOrEmail!, 
      password: password! 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Login successful!'
          });
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Login failed. Please try again.'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
