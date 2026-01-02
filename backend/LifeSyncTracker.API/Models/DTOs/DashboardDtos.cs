namespace LifeSyncTracker.API.Models.DTOs;

/// <summary>
/// DTO for dashboard statistics.
/// </summary>
public class DashboardStatsDto
{
    /// <summary>
    /// Time distribution by project for the current week/month.
    /// </summary>
    public List<TimeDistributionDto> TimeDistribution { get; set; } = new List<TimeDistributionDto>();

    /// <summary>
    /// Monthly financial flow (income vs expenses).
    /// </summary>
    public List<MonthlyFlowDto> MonthlyFlow { get; set; } = new List<MonthlyFlowDto>();

    /// <summary>
    /// Productivity heatmap data (hours per day).
    /// </summary>
    public List<DailyProductivityDto> ProductivityHeatmap { get; set; } = new List<DailyProductivityDto>();

    /// <summary>
    /// Total hours tracked this week.
    /// </summary>
    public double WeeklyHours { get; set; }

    /// <summary>
    /// Total hours tracked this month.
    /// </summary>
    public double MonthlyHours { get; set; }

    /// <summary>
    /// Current month's income.
    /// </summary>
    public decimal MonthlyIncome { get; set; }

    /// <summary>
    /// Current month's expenses.
    /// </summary>
    public decimal MonthlyExpenses { get; set; }

    /// <summary>
    /// Active projects count.
    /// </summary>
    public int ActiveProjectsCount { get; set; }

    /// <summary>
    /// Currently running timer (if any).
    /// </summary>
    public TimeEntryDto? RunningTimer { get; set; }
}

/// <summary>
/// DTO for time distribution by project.
/// </summary>
public class TimeDistributionDto
{
    /// <summary>
    /// Project ID.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Project name.
    /// </summary>
    public string ProjectName { get; set; } = string.Empty;

    /// <summary>
    /// Project color code.
    /// </summary>
    public string? ColorCode { get; set; }

    /// <summary>
    /// Total hours for this project.
    /// </summary>
    public double TotalHours { get; set; }

    /// <summary>
    /// Percentage of total time.
    /// </summary>
    public double Percentage { get; set; }
}

/// <summary>
/// DTO for monthly financial flow.
/// </summary>
public class MonthlyFlowDto
{
    /// <summary>
    /// Month (1-12).
    /// </summary>
    public int Month { get; set; }

    /// <summary>
    /// Year.
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Month label (e.g., "Jan 2024").
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Total income for the month.
    /// </summary>
    public decimal Income { get; set; }

    /// <summary>
    /// Total expenses for the month.
    /// </summary>
    public decimal Expenses { get; set; }
}

/// <summary>
/// DTO for daily productivity (heatmap).
/// </summary>
public class DailyProductivityDto
{
    /// <summary>
    /// Date.
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Hours worked on this day.
    /// </summary>
    public double Hours { get; set; }

    /// <summary>
    /// Intensity level (0-4) for heatmap coloring.
    /// </summary>
    public int IntensityLevel { get; set; }
}
