using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.Entities;

/// <summary>
/// Represents a user in the LifeSync Tracker system.
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Username for login. Must be unique.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// BCrypt hashed password.
    /// </summary>
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// User's email address. Must be unique.
    /// </summary>
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Date and time when the user was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the user was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// Projects owned by this user.
    /// </summary>
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    /// <summary>
    /// Time entries created by this user.
    /// </summary>
    public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();

    /// <summary>
    /// Transaction categories created by this user.
    /// </summary>
    public virtual ICollection<TransactionCategory> TransactionCategories { get; set; } = new List<TransactionCategory>();

    /// <summary>
    /// Transactions created by this user.
    /// </summary>
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    /// <summary>
    /// Tags created by this user.
    /// </summary>
    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
