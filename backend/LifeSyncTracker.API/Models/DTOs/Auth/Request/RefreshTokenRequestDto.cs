using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Auth.Request
{
    /// <summary>
    /// DTO for requesting a token refresh.
    /// </summary>
    public class RefreshTokenRequestDto
    {
        /// <summary>
        /// The current (possibly expired) access token.
        /// </summary>
        [Required]
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// The refresh token.
        /// </summary>
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
