namespace LifeSyncTracker.API.Models.DTOs.Dashboard.Response
{
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
}
