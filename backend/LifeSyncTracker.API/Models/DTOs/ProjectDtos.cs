using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs;

/// <summary>
/// DTO for creating a new project.
/// </summary>
public class CreateProjectDto
{
    /// <summary>
    /// Name of the project.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Optional hourly rate for calculating earnings.
    /// </summary>
    [Range(0, double.MaxValue)]
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// Whether to automatically create income transactions. Defaults to false.
    /// </summary>
    public bool AutoCreateIncome { get; set; } = false;

    /// <summary>
    /// Description of the project.
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating a project.
/// </summary>
public class UpdateProjectDto
{
    /// <summary>
    /// Name of the project.
    /// </summary>
    [MaxLength(200)]
    public string? Name { get; set; }

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Optional hourly rate for calculating earnings.
    /// </summary>
    [Range(0, double.MaxValue)]
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// Whether to automatically create income transactions.
    /// </summary>
    public bool? AutoCreateIncome { get; set; }

    /// <summary>
    /// Description of the project.
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Whether the project is active.
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// DTO for project response.
/// </summary>
public class ProjectDto
{
    /// <summary>
    /// Project ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Name of the project.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    public string? ColorCode { get; set; }

    /// <summary>
    /// Optional hourly rate.
    /// </summary>
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// Whether to automatically create income transactions.
    /// </summary>
    public bool AutoCreateIncome { get; set; }

    /// <summary>
    /// Description of the project.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether the project is active.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Creation date.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Total hours tracked for this project.
    /// </summary>
    public double TotalHours { get; set; }
}
