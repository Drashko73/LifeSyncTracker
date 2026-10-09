using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Auth.Request
{
    /// <summary>
    /// DTO for user registration.
    /// </summary>
    public class RegisterDto
    {
        /// <summary>
        /// Verification code sent to the email address.
        /// </summary>
        [Required]
        [RegularExpression("^[0-9]{6}$")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Username for the new account.
        /// </summary>
        [Required]
        [MinLength(3)]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// Email address for the new account.
        /// </summary>
        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Password for the new account.
        /// </summary>
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}
