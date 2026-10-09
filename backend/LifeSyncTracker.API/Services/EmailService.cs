using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using LifeSyncTracker.API.Models.Options;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// SMTP email service.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailOptions _emailOptions;
    private readonly IWebHostEnvironment _environment;

    public EmailService(IOptions<EmailOptions> emailOptions, IWebHostEnvironment environment)
    {
        _emailOptions = emailOptions.Value;
        _environment = environment;
    }

    /// <inheritdoc />
    public async Task SendVerificationCodeAsync(string toEmail, string verificationCode, int expiresInMinutes)
    {
        var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "Emails", "VerificationCodeTemplate.html");
        var htmlBody = await File.ReadAllTextAsync(templatePath);
        htmlBody = htmlBody
            .Replace("{{VERIFICATION_CODE}}", verificationCode)
            .Replace("{{EXPIRY_MINUTES}}", expiresInMinutes.ToString());

        using var message = new MailMessage
        {
            From = new MailAddress(_emailOptions.FromEmail, _emailOptions.FromName),
            Subject = "Your LifeSync Tracker verification code",
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(new MailAddress(toEmail));

        using var client = new SmtpClient(_emailOptions.Host, _emailOptions.Port)
        {
            EnableSsl = _emailOptions.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(_emailOptions.Username))
        {
            client.Credentials = new NetworkCredential(_emailOptions.Username, _emailOptions.Password);
        }

        await client.SendMailAsync(message);
    }
}
