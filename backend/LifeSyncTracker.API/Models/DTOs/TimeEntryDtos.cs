using LifeSyncTracker.API.Models.DTOs.Project.Response;
using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs;

/// <summary>
/// DTO for starting a timer.
/// </summary>
public class StartTimerDto
{
    /// <summary>
    /// Optional project to associate with the timer.
    /// </summary>
    public int? ProjectId { get; set; }
}

/// <summary>
/// DTO for stopping a timer.
/// </summary>
public class StopTimerDto
{
    /// <summary>
    /// Project to associate with the time entry.
    /// </summary>
    public int? ProjectId { get; set; }

    /// <summary>
    /// Description of what was done.
    /// </summary>
    [MaxLength(4000)]
    public string? Description { get; set; }

    /// <summary>
    /// Handover note - what should be done next.
    /// </summary>
    [MaxLength(4000)]
    public string? NextSteps { get; set; }

    /// <summary>
    /// Tags to associate with the time entry.
    /// </summary>
    public List<int> TagIds { get; set; } = new List<int>();
}

/// <summary>
/// DTO for creating a manual time entry.
/// </summary>
public class CreateTimeEntryDto
{
    /// <summary>
    /// Start time of the work session.
    /// </summary>
    [Required]
    public DateTime StartTime { get; set; }

    /// <summary>
    /// End time of the work session.
    /// </summary>
    [Required]
    public DateTime EndTime { get; set; }

    /// <summary>
    /// Project to associate with the time entry.
    /// </summary>
    public int? ProjectId { get; set; }

    /// <summary>
    /// Description of what was done.
    /// </summary>
    [MaxLength(4000)]
    public string? Description { get; set; }

    /// <summary>
    /// Handover note - what should be done next.
    /// </summary>
    [MaxLength(4000)]
    public string? NextSteps { get; set; }

    /// <summary>
    /// Tags to associate with the time entry.
    /// </summary>
    public List<int> TagIds { get; set; } = new List<int>();
}

/// <summary>
/// DTO for updating a time entry.
/// </summary>
public class UpdateTimeEntryDto
{
    /// <summary>
    /// Start time of the work session.
    /// </summary>
    public DateTime? StartTime { get; set; }

    /// <summary>
    /// End time of the work session.
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Project to associate with the time entry.
    /// </summary>
    public int? ProjectId { get; set; }

    /// <summary>
    /// Description of what was done.
    /// </summary>
    [MaxLength(4000)]
    public string? Description { get; set; }

    /// <summary>
    /// Handover note - what should be done next.
    /// </summary>
    [MaxLength(4000)]
    public string? NextSteps { get; set; }

    /// <summary>
    /// Tags to associate with the time entry.
    /// </summary>
    public List<int>? TagIds { get; set; }
}

/// <summary>
/// DTO for time entry response.
/// </summary>
public class TimeEntryDto
{
    /// <summary>
    /// Time entry ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Start time of the work session.
    /// </summary>
    public DateTime StartTime { get; set; }

    /// <summary>
    /// End time of the work session.
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Duration in minutes.
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Description of what was done.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Handover note - what should be done next.
    /// </summary>
    public string? NextSteps { get; set; }

    /// <summary>
    /// Whether the timer is running.
    /// </summary>
    public bool IsRunning { get; set; }

    /// <summary>
    /// Project information.
    /// </summary>
    public ProjectDto? Project { get; set; }

    /// <summary>
    /// Tags associated with this entry.
    /// </summary>
    public List<TagDto> Tags { get; set; } = new List<TagDto>();

    /// <summary>
    /// Creation date.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for time entry filtering.
/// </summary>
public class TimeEntryFilterDto
{
    /// <summary>
    /// Filter by project ID.
    /// </summary>
    public int? ProjectId { get; set; }

    /// <summary>
    /// Filter by start date (inclusive).
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Filter by end date (inclusive).
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Filter by tags.
    /// </summary>
    public List<int>? TagIds { get; set; }

    /// <summary>
    /// Page number (1-based).
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Page size.
    /// </summary>
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// DTO for employer report.
/// </summary>
public class EmployerReportDto
{
    /// <summary>
    /// Project information.
    /// </summary>
    public ProjectDto Project { get; set; } = null!;

    /// <summary>
    /// Report period start.
    /// </summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// Report period end.
    /// </summary>
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// Total hours worked.
    /// </summary>
    public double TotalHours { get; set; }

    /// <summary>
    /// Total earnings (if hourly rate is set).
    /// </summary>
    public decimal? TotalEarnings { get; set; }

    /// <summary>
    /// Time entries in this period.
    /// </summary>
    public List<TimeEntryDto> TimeEntries { get; set; } = new List<TimeEntryDto>();
}
