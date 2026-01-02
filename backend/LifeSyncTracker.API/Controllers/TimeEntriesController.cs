using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Controllers;

/// <summary>
/// Controller for time tracking operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _timeEntryService;

    /// <summary>
    /// Initializes a new instance of the TimeEntriesController.
    /// </summary>
    /// <param name="timeEntryService">Time entry service.</param>
    public TimeEntriesController(ITimeEntryService timeEntryService)
    {
        _timeEntryService = timeEntryService;
    }

    /// <summary>
    /// Gets time entries with filtering and pagination.
    /// </summary>
    /// <param name="filter">Filter criteria.</param>
    /// <returns>Paginated list of time entries.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<TimeEntryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<TimeEntryDto>>>> GetAll([FromQuery] TimeEntryFilterDto filter)
    {
        var userId = GetUserId();
        var entries = await _timeEntryService.GetAllAsync(userId, filter);
        return Ok(ApiResponse<PaginatedResponse<TimeEntryDto>>.SuccessResponse(entries));
    }

    /// <summary>
    /// Gets a time entry by ID.
    /// </summary>
    /// <param name="id">Time entry ID.</param>
    /// <returns>Time entry information.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TimeEntryDto>>> GetById(int id)
    {
        var userId = GetUserId();
        var entry = await _timeEntryService.GetByIdAsync(userId, id);

        if (entry == null)
        {
            return NotFound(ApiResponse<TimeEntryDto>.ErrorResponse("Time entry not found."));
        }

        return Ok(ApiResponse<TimeEntryDto>.SuccessResponse(entry));
    }

    /// <summary>
    /// Gets the currently running timer.
    /// </summary>
    /// <returns>Running time entry or null.</returns>
    [HttpGet("running")]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<TimeEntryDto?>>> GetRunningTimer()
    {
        var userId = GetUserId();
        var entry = await _timeEntryService.GetRunningTimerAsync(userId);
        return Ok(ApiResponse<TimeEntryDto?>.SuccessResponse(entry));
    }

    /// <summary>
    /// Starts a new timer.
    /// </summary>
    /// <param name="dto">Timer start data.</param>
    /// <returns>Created time entry.</returns>
    [HttpPost("start")]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TimeEntryDto>>> StartTimer([FromBody] StartTimerDto dto)
    {
        try
        {
            var userId = GetUserId();
            var entry = await _timeEntryService.StartTimerAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, ApiResponse<TimeEntryDto>.SuccessResponse(entry, "Timer started."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TimeEntryDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Stops the running timer.
    /// </summary>
    /// <param name="dto">Timer stop data.</param>
    /// <returns>Updated time entry.</returns>
    [HttpPost("stop")]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TimeEntryDto>>> StopTimer([FromBody] StopTimerDto dto)
    {
        var userId = GetUserId();
        var entry = await _timeEntryService.StopTimerAsync(userId, dto);

        if (entry == null)
        {
            return NotFound(ApiResponse<TimeEntryDto>.ErrorResponse("No running timer found."));
        }

        return Ok(ApiResponse<TimeEntryDto>.SuccessResponse(entry, "Timer stopped and saved."));
    }

    /// <summary>
    /// Creates a manual time entry.
    /// </summary>
    /// <param name="dto">Time entry data.</param>
    /// <returns>Created time entry.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TimeEntryDto>>> CreateManualEntry([FromBody] CreateTimeEntryDto dto)
    {
        try
        {
            var userId = GetUserId();
            var entry = await _timeEntryService.CreateManualEntryAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, ApiResponse<TimeEntryDto>.SuccessResponse(entry, "Time entry created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TimeEntryDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Updates a time entry.
    /// </summary>
    /// <param name="id">Time entry ID.</param>
    /// <param name="dto">Updated time entry data.</param>
    /// <returns>Updated time entry.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TimeEntryDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TimeEntryDto>>> Update(int id, [FromBody] UpdateTimeEntryDto dto)
    {
        try
        {
            var userId = GetUserId();
            var entry = await _timeEntryService.UpdateAsync(userId, id, dto);

            if (entry == null)
            {
                return NotFound(ApiResponse<TimeEntryDto>.ErrorResponse("Time entry not found."));
            }

            return Ok(ApiResponse<TimeEntryDto>.SuccessResponse(entry, "Time entry updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TimeEntryDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Deletes a time entry.
    /// </summary>
    /// <param name="id">Time entry ID.</param>
    /// <returns>Success status.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetUserId();
        var deleted = await _timeEntryService.DeleteAsync(userId, id);

        if (!deleted)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Time entry not found."));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, "Time entry deleted successfully."));
    }

    /// <summary>
    /// Gets employer report for a project and month.
    /// </summary>
    /// <param name="projectId">Project ID.</param>
    /// <param name="year">Year.</param>
    /// <param name="month">Month (1-12).</param>
    /// <returns>Employer report.</returns>
    [HttpGet("report")]
    [ProducesResponseType(typeof(ApiResponse<EmployerReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EmployerReportDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EmployerReportDto>>> GetEmployerReport([FromQuery] int projectId, [FromQuery] int year, [FromQuery] int month)
    {
        var userId = GetUserId();
        var report = await _timeEntryService.GetEmployerReportAsync(userId, projectId, year, month);

        if (report == null)
        {
            return NotFound(ApiResponse<EmployerReportDto>.ErrorResponse("Project not found."));
        }

        return Ok(ApiResponse<EmployerReportDto>.SuccessResponse(report));
    }

    /// <summary>
    /// Gets the user ID from the JWT token claims.
    /// </summary>
    /// <returns>User ID.</returns>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
}
