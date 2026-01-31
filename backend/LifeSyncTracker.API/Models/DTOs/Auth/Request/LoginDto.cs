using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Auth.Request
{
    /// <summary>
    /// DTO for user login.
    /// </summary>
    public class LoginDto
    {
        /// <summary>
        /// Username or email for login.
        /// </summary>
        [Required]
        public string UsernameOrEmail { get; set; } = string.Empty;

        /// <summary>
        /// Password for login.
        /// </summary>
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
