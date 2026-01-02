using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Controllers;

/// <summary>
/// Controller for dashboard and analytics operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    /// <summary>
    /// Initializes a new instance of the DashboardController.
    /// </summary>
    /// <param name="dashboardService">Dashboard service.</param>
    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Gets comprehensive dashboard statistics.
    /// </summary>
    /// <returns>Dashboard statistics.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetDashboardStats()
    {
        var userId = GetUserId();
        var stats = await _dashboardService.GetDashboardStatsAsync(userId);
        return Ok(ApiResponse<DashboardStatsDto>.SuccessResponse(stats));
    }

    /// <summary>
    /// Gets time distribution by project for a period.
    /// </summary>
    /// <param name="startDate">Period start date.</param>
    /// <param name="endDate">Period end date.</param>
    /// <returns>Time distribution data.</returns>
    [HttpGet("time-distribution")]
    [ProducesResponseType(typeof(ApiResponse<List<TimeDistributionDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<TimeDistributionDto>>>> GetTimeDistribution([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var userId = GetUserId();
        var distribution = await _dashboardService.GetTimeDistributionAsync(userId, startDate, endDate);
        return Ok(ApiResponse<List<TimeDistributionDto>>.SuccessResponse(distribution));
    }

    /// <summary>
    /// Gets monthly financial flow data.
    /// </summary>
    /// <param name="months">Number of months to include (default: 12).</param>
    /// <returns>Monthly flow data.</returns>
    [HttpGet("monthly-flow")]
    [ProducesResponseType(typeof(ApiResponse<List<MonthlyFlowDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<MonthlyFlowDto>>>> GetMonthlyFlow([FromQuery] int months = 12)
    {
        var userId = GetUserId();
        var flow = await _dashboardService.GetMonthlyFlowAsync(userId, months);
        return Ok(ApiResponse<List<MonthlyFlowDto>>.SuccessResponse(flow));
    }

    /// <summary>
    /// Gets productivity heatmap data for a year.
    /// </summary>
    /// <param name="year">Year (defaults to current year).</param>
    /// <returns>Daily productivity data.</returns>
    [HttpGet("productivity-heatmap")]
    [ProducesResponseType(typeof(ApiResponse<List<DailyProductivityDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<DailyProductivityDto>>>> GetProductivityHeatmap([FromQuery] int? year = null)
    {
        var userId = GetUserId();
        var targetYear = year ?? DateTime.UtcNow.Year;
        var heatmap = await _dashboardService.GetProductivityHeatmapAsync(userId, targetYear);
        return Ok(ApiResponse<List<DailyProductivityDto>>.SuccessResponse(heatmap));
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
