using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Project.Request
{
    /// <summary>
    /// DTO for creating a new project.
    /// </summary>
    public class CreateProjectDto
    {
        /// <summary>
        /// Name of the project.
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Color code for visual identification.
        /// </summary>
        [MaxLength(20)]
        public string? ColorCode { get; set; }

        /// <summary>
        /// Optional hourly rate for calculating earnings.
        /// </summary>
        [Range(0, double.MaxValue)]
        public decimal? HourlyRate { get; set; }

        /// <summary>
        /// Whether to automatically create income transactions. Defaults to false.
        /// </summary>
        public bool AutoCreateIncome { get; set; } = false;

        /// <summary>
        /// Description of the project.
        /// </summary>
        [MaxLength(1000)]
        public string? Description { get; set; }
    }
}
