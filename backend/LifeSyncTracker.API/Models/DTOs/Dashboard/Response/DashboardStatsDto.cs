namespace LifeSyncTracker.API.Models.DTOs.Dashboard.Response
{
    /// <summary>
    /// DTO for dashboard statistics.
    /// </summary>
    public class DashboardStatsDto
    {
        /// <summary>
        /// Time distribution by project for the current week/month.
        /// </summary>
        public List<TimeDistributionDto> TimeDistribution { get; set; } = new List<TimeDistributionDto>();

        /// <summary>
        /// Monthly financial flow (income vs expenses).
        /// </summary>
        public List<MonthlyFlowDto> MonthlyFlow { get; set; } = new List<MonthlyFlowDto>();

        /// <summary>
        /// Productivity heatmap data (hours per day).
        /// </summary>
        public List<DailyProductivityDto> ProductivityHeatmap { get; set; } = new List<DailyProductivityDto>();

        /// <summary>
        /// Total hours tracked this week.
        /// </summary>
        public double WeeklyHours { get; set; }

        /// <summary>
        /// Total hours tracked this month.
        /// </summary>
        public double MonthlyHours { get; set; }

        /// <summary>
        /// Current month's income.
        /// </summary>
        public decimal MonthlyIncome { get; set; }

        /// <summary>
        /// Current month's expenses.
        /// </summary>
        public decimal MonthlyExpenses { get; set; }

        /// <summary>
        /// Active projects count.
        /// </summary>
        public int ActiveProjectsCount { get; set; }

        /// <summary>
        /// Currently running timer (if any).
        /// </summary>
        public TimeEntryDto? RunningTimer { get; set; }
    }
}
