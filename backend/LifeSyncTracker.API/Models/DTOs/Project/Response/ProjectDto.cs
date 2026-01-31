namespace LifeSyncTracker.API.Models.DTOs.Project.Response
{
    /// <summary>
    /// DTO for project response.
    /// </summary>
    public class ProjectDto
    {
        /// <summary>
        /// Project ID.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Name of the project.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Color code for visual identification.
        /// </summary>
        public string? ColorCode { get; set; }

        /// <summary>
        /// Optional hourly rate.
        /// </summary>
        public decimal? HourlyRate { get; set; }

        /// <summary>
        /// Whether to automatically create income transactions.
        /// </summary>
        public bool AutoCreateIncome { get; set; }

        /// <summary>
        /// Description of the project.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Whether the project is active.
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Creation date.
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Total hours tracked for this project.
        /// </summary>
        public double TotalHours { get; set; }
    }
}
