using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs.Project.Request
{
    /// <summary>
    /// DTO for updating a project.
    /// </summary>
    public class UpdateProjectDto
    {
        /// <summary>
        /// Name of the project.
        /// </summary>
        [MaxLength(200)]
        public string? Name { get; set; }

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
        /// Whether to automatically create income transactions.
        /// </summary>
        public bool? AutoCreateIncome { get; set; }

        /// <summary>
        /// Description of the project.
        /// </summary>
        [MaxLength(1000)]
        public string? Description { get; set; }

        /// <summary>
        /// Whether the project is active.
        /// </summary>
        public bool? IsActive { get; set; }
    }
}
