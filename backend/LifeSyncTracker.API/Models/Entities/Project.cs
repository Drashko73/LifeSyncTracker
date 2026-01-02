using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LifeSyncTracker.API.Models.Entities;

/// <summary>
/// Represents a project for grouping time entries (e.g., "Company A", "Personal Learning").
/// </summary>
public class Project
{
    /// <summary>
    /// Unique identifier for the project.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Name of the project.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Color code for visual identification (e.g., "#FF5733").
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Optional hourly rate for calculating earnings.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// Whether to automatically create income transactions from time entries.
    /// </summary>
    public bool AutoCreateIncome { get; set; } = true;

    /// <summary>
    /// Description of the project.
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Whether the project is active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Date and time when the project was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the project was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Foreign key to the owning user.
    /// </summary>
    [Required]
    public int UserId { get; set; }

    // Navigation properties

    /// <summary>
    /// The user who owns this project.
    /// </summary>
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Time entries associated with this project.
    /// </summary>
    public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
