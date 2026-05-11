using LifeSyncTracker.API.Models.DTOs.Common.Response;
using LifeSyncTracker.API.Models.DTOs.Statistics.Response;
using LifeSyncTracker.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LifeSyncTracker.API.Controllers
{
    /// <summary>
    /// Controller for gathering and providing statistics related to the application and user activities.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private readonly IStatsService _statsService;

        public StatsController(IStatsService statsService)
        {
            _statsService = statsService;
        }


        [HttpGet("overall")]
        [ProducesResponseType(typeof(ApiResponse<StatsDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<StatsDto>>> GetOverallStats()
        {
            return Ok(ApiResponse<StatsDto>.SuccessResponse(await _statsService.GetOverallStatsAsync()));
        }
    }
}
