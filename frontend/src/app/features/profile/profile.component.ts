import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

/**
 * Profile component for displaying user information and changing password.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    AvatarModule,
    DividerModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  /** User data loaded from the API */
  user = signal<User | null>(null);

  /** Whether user info is loading */
  isLoadingUser = signal(true);

  /** Whether password change is submitting */
  isChangingPassword = false;

  /** Password change form with same constraints as registration (min 6 chars) */
  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.loadUser();
  }

  /**
   * Custom validator to ensure newPassword and confirmPassword match.
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear the mismatch error if they now match (but keep other errors)
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  /**
   * Loads user information from the API and falls back to local signal.
   */
  private loadUser(): void {
    // First, populate from already stored user
    const localUser = this.authService.currentUser();
    if (localUser) {
      this.user.set(localUser);
    }

    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user.set(response.data);
        }
        this.isLoadingUser.set(false);
      },
      error: () => {
        // Fall back to locally stored user
        this.isLoadingUser.set(false);
      },
    });
  }

  /**
   * Handles password change form submission.
   */
  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!,
    }).subscribe({
      next: (response) => {
        this.isChangingPassword = false;
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully!',
          });
          this.passwordForm.reset();
        }
      },
      error: (error) => {
        this.isChangingPassword = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to change password. Please try again.',
        });
      },
    });
  }

  /**
   * Returns the user's initials for the avatar placeholder.
   */
  getInitials(): string {
    const u = this.user();
    if (!u?.username) return 'U';
    return u.username.charAt(0).toUpperCase();
  }
}
