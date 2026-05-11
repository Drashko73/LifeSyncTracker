using LifeSyncTracker.API.Models.DTOs.Statistics.Response;

namespace LifeSyncTracker.API.Services.Interfaces
{
    /// <summary>
    /// Service for gathering and providing statistics related to the application and user activities.
    /// </summary>
    public interface IStatsService
    {
        Task<StatsDto> GetOverallStatsAsync();
    }
}
