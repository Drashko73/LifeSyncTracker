using Microsoft.AspNetCore.Mvc;

namespace LifeSyncTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {

        /// <summary>
        /// Gets the health status of the backend API.
        /// </summary>
        /// <returns>Object containing the status and current UTC time.</returns>
        [HttpGet("healthcheck")]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "Healthy", timestampUtc = DateTime.UtcNow });
        }

    }
}
