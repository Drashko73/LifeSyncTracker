using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Auth.Request
{
    /// <summary>
    /// DTO for requesting an email verification code.
    /// </summary>
    public class SendVerificationCodeDto
    {
        /// <summary>
        /// Email address to verify.
        /// </summary>
        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;
    }
}
