using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Auth.Request
{
    /// <summary>
    /// DTO for validating an email verification code.
    /// </summary>
    public class VerifyCodeDto
    {
        /// <summary>
        /// Email address associated with the verification code.
        /// </summary>
        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Verification code received by email.
        /// </summary>
        [Required]
        [RegularExpression("^[0-9]{6}$")]
        public string Code { get; set; } = string.Empty;
    }
}
