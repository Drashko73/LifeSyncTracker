namespace LifeSyncTracker.API.Models.DTOs.Auth.Request
{
    public class ChangePasswordDto
    {
        /// <summary>
        /// The user's current password.
        /// </summary>
        public string CurrentPassword { get; set; } = null!;
        /// <summary>
        /// The new password the user wants to set.
        /// </summary>
        public string NewPassword { get; set; } = null!;
    }
}
