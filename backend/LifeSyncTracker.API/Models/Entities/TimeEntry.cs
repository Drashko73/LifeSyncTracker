using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LifeSyncTracker.API.Models.Entities;

/// <summary>
/// Represents a time entry for tracking work on a project.
/// </summary>
public class TimeEntry
{
    /// <summary>
    /// Unique identifier for the time entry.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Start time of the work session.
    /// </summary>
    [Required]
    public DateTime StartTime { get; set; }

    /// <summary>
    /// End time of the work session. Null if timer is still running.
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Calculated duration in minutes. Updated when EndTime is set.
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Description of what was done during this time entry.
    /// </summary>
    [MaxLength(4000)]
    public string? Description { get; set; }

    /// <summary>
    /// Handover note - what should be done next.
    /// </summary>
    [MaxLength(4000)]
    public string? NextSteps { get; set; }

    /// <summary>
    /// Whether this time entry is currently active (timer running).
    /// </summary>
    public bool IsRunning { get; set; } = false;

    /// <summary>
    /// Date and time when the time entry was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the time entry was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Foreign key to the project.
    /// </summary>
    public int? ProjectId { get; set; }

    /// <summary>
    /// Foreign key to the user.
    /// </summary>
    [Required]
    public int UserId { get; set; }

    // Navigation properties

    /// <summary>
    /// The project this time entry belongs to.
    /// </summary>
    [ForeignKey("ProjectId")]
    public virtual Project? Project { get; set; }

    /// <summary>
    /// The user who created this time entry.
    /// </summary>
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Tags associated with this time entry (many-to-many).
    /// </summary>
    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();

    /// <summary>
    /// The transaction created from this time entry (if any).
    /// </summary>
    public virtual Transaction? LinkedTransaction { get; set; }
}
