namespace LifeSyncTracker.API.Models.DTOs.Dashboard.Response
{
    /// <summary>
    /// DTO for monthly financial flow.
    /// </summary>
    public class MonthlyFlowDto
    {
        /// <summary>
        /// Month (1-12).
        /// </summary>
        public int Month { get; set; }

        /// <summary>
        /// Year.
        /// </summary>
        public int Year { get; set; }

        /// <summary>
        /// Month label (e.g., "Jan 2024").
        /// </summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>
        /// Total income for the month.
        /// </summary>
        public decimal Income { get; set; }

        /// <summary>
        /// Total expenses for the month.
        /// </summary>
        public decimal Expenses { get; set; }
    }
}
