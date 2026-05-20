using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.Entities;

/// <summary>
/// Represents a single email verification code issuance.
/// </summary>
public class EmailVerificationToken
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(256)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime ExpiresAt { get; set; }

    [Required]
    [DefaultValue(false)]
    public bool IsUsed { get; set; }

    public DateTime? UsedAt { get; set; }
}
