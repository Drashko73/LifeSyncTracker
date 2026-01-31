namespace LifeSyncTracker.API.Models.DTOs.Dashboard.Response
{
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
}
