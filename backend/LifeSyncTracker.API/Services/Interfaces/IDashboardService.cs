using LifeSyncTracker.API.Models.DTOs.Dashboard.Response;

namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for dashboard and analytics operations.
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Gets dashboard statistics for a user.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>Dashboard statistics.</returns>
    Task<DashboardStatsDto> GetDashboardStatsAsync(int userId);

    /// <summary>
    /// Gets time distribution by project for a period.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="startDate">Period start date.</param>
    /// <param name="endDate">Period end date.</param>
    /// <returns>Time distribution data.</returns>
    Task<List<TimeDistributionDto>> GetTimeDistributionAsync(int userId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Gets monthly financial flow data.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="months">Number of months to include.</param>
    /// <returns>Monthly flow data.</returns>
    Task<List<MonthlyFlowDto>> GetMonthlyFlowAsync(int userId, int months = 12);

    /// <summary>
    /// Gets productivity heatmap data for a year.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="year">Year.</param>
    /// <returns>Daily productivity data.</returns>
    Task<List<DailyProductivityDto>> GetProductivityHeatmapAsync(int userId, int year);
}
