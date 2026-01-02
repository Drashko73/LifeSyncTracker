using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LifeSyncTracker.API.Models.Entities;

/// <summary>
/// Represents a tag for categorizing time entries (e.g., "Development", "Meeting", "Planning").
/// </summary>
public class Tag
{
    /// <summary>
    /// Unique identifier for the tag.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Name of the tag.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Color code for visual identification (e.g., "#FF5733").
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Date and time when the tag was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Foreign key to the owning user.
    /// </summary>
    [Required]
    public int UserId { get; set; }

    // Navigation properties

    /// <summary>
    /// The user who owns this tag.
    /// </summary>
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Time entries associated with this tag (many-to-many).
    /// </summary>
    public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
