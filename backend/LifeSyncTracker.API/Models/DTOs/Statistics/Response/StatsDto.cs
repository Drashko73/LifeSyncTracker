namespace LifeSyncTracker.API.Models.DTOs.Statistics.Response
{
    public class StatsDto
    {
        public int TotalNumberOfUsers { get; set; }
        public double TotalNumberOfHoursTracked { get; set; }
        public decimal TotalIncomeTracked { get; set; }
        public decimal TotalExpensesTracked { get; set; }
    }
}
