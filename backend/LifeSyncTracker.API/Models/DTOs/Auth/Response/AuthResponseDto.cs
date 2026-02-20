namespace LifeSyncTracker.API.Models.DTOs.Auth.Response
{
    /// <summary>
    /// DTO for authentication response.
    /// </summary>
    public class AuthResponseDto
    {
        /// <summary>
        /// JWT access token.
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Refresh token for obtaining new access tokens.
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;

        /// <summary>
        /// Token expiration time.
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// User information.
        /// </summary>
        public UserDto User { get; set; } = null!;
    }
}
