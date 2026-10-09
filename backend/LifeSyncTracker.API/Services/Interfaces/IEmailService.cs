namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for sending email messages.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends verification code email.
    /// </summary>
    /// <param name="toEmail">Recipient email address.</param>
    /// <param name="verificationCode">Verification code.</param>
    /// <param name="expiresInMinutes">Code expiration time in minutes.</param>
    Task SendVerificationCodeAsync(string toEmail, string verificationCode, int expiresInMinutes);
}
