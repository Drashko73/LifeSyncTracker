using LifeSyncTracker.API.Models.DTOs;

namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for time tracking operations.
/// </summary>
public interface ITimeEntryService
{
    /// <summary>
    /// Gets time entries with filtering and pagination.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="filter">Filter criteria.</param>
    /// <returns>Paginated list of time entries.</returns>
    Task<PaginatedResponse<TimeEntryDto>> GetAllAsync(int userId, TimeEntryFilterDto filter);

    /// <summary>
    /// Gets a time entry by ID.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="entryId">Time entry ID.</param>
    /// <returns>Time entry information.</returns>
    Task<TimeEntryDto?> GetByIdAsync(int userId, int entryId);

    /// <summary>
    /// Gets the currently running timer for a user.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>Running time entry or null.</returns>
    Task<TimeEntryDto?> GetRunningTimerAsync(int userId);

    /// <summary>
    /// Starts a new timer.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Timer start data.</param>
    /// <returns>Created time entry.</returns>
    Task<TimeEntryDto> StartTimerAsync(int userId, StartTimerDto dto);

    /// <summary>
    /// Stops the running timer.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Timer stop data.</param>
    /// <returns>Updated time entry.</returns>
    Task<TimeEntryDto?> StopTimerAsync(int userId, StopTimerDto dto);

    /// <summary>
    /// Creates a manual time entry.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Time entry data.</param>
    /// <returns>Created time entry.</returns>
    Task<TimeEntryDto> CreateManualEntryAsync(int userId, CreateTimeEntryDto dto);

    /// <summary>
    /// Updates a time entry.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="entryId">Time entry ID.</param>
    /// <param name="dto">Updated time entry data.</param>
    /// <returns>Updated time entry.</returns>
    Task<TimeEntryDto?> UpdateAsync(int userId, int entryId, UpdateTimeEntryDto dto);

    /// <summary>
    /// Deletes a time entry.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="entryId">Time entry ID.</param>
    /// <returns>True if deleted successfully.</returns>
    Task<bool> DeleteAsync(int userId, int entryId);

    /// <summary>
    /// Generates employer report for a project and time period.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="projectId">Project ID.</param>
    /// <param name="year">Year.</param>
    /// <param name="month">Month (1-12).</param>
    /// <returns>Employer report.</returns>
    Task<EmployerReportDto?> GetEmployerReportAsync(int userId, int projectId, int year, int month);
}
