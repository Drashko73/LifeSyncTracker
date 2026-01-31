namespace LifeSyncTracker.API.Models.DTOs.Auth.Response
{
    /// <summary>
    /// DTO for user information.
    /// </summary>
    public class UserDto
    {
        /// <summary>
        /// User ID.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Username.
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// Email address.
        /// </summary>
        public string Email { get; set; } = string.Empty;
    }
}
