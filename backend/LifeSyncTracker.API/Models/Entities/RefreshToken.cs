using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.Entities
{
    /// <summary>
    /// Represents a refresh token used for renewing access tokens in the authentication process.
    /// Identified by a composite key of UserId and DeviceIdentifier, allowing one active token per device per user.
    /// </summary>
    public class RefreshToken
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public required string DeviceIdentifier { get; set; }

        [Required]
        [MaxLength(255)]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        [Required]
        [DefaultValue(false)]
        public bool IsRevoked { get; set; } = false;

        // Navigation property
        public virtual User User { get; set; } = null!;
    }
}