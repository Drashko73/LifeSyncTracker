using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of dashboard and analytics service.
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly ITimeEntryService _timeEntryService;

    /// <summary>
    /// Initializes a new instance of the DashboardService.
    /// </summary>
    /// <param name="context">Database context.</param>
    /// <param name="timeEntryService">Time entry service.</param>
    public DashboardService(ApplicationDbContext context, ITimeEntryService timeEntryService)
    {
        _context = context;
        _timeEntryService = timeEntryService;
    }

    /// <inheritdoc />
    public async Task<DashboardStatsDto> GetDashboardStatsAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var startOfWeek = now.Date.AddDays(-(int)now.DayOfWeek);
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // Get running timer
        var runningTimer = await _timeEntryService.GetRunningTimerAsync(userId);

        // Calculate weekly hours
        var weeklyMinutes = await _context.TimeEntries
            .Where(te => te.UserId == userId
                && te.StartTime >= startOfWeek
                && te.DurationMinutes.HasValue)
            .SumAsync(te => te.DurationMinutes ?? 0);

        // Calculate monthly hours
        var monthlyMinutes = await _context.TimeEntries
            .Where(te => te.UserId == userId
                && te.StartTime >= startOfMonth
                && te.DurationMinutes.HasValue)
            .SumAsync(te => te.DurationMinutes ?? 0);

        // Calculate monthly income
        var monthlyIncome = await _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId
                && t.Date >= startOfMonth
                && t.Category.Type == TransactionType.Income)
            .SumAsync(t => t.Amount);

        // Calculate monthly expenses
        var monthlyExpenses = await _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId
                && t.Date >= startOfMonth
                && t.Category.Type == TransactionType.Expense)
            .SumAsync(t => t.Amount);

        // Get active projects count
        var activeProjectsCount = await _context.Projects
            .Where(p => p.UserId == userId && p.IsActive)
            .CountAsync();

        // Get time distribution for current month
        var timeDistribution = await GetTimeDistributionAsync(userId, startOfMonth, now);

        // Get monthly flow for last 6 months
        var monthlyFlow = await GetMonthlyFlowAsync(userId, 6);

        // Get productivity heatmap for current year
        var productivityHeatmap = await GetProductivityHeatmapAsync(userId, now.Year);

        return new DashboardStatsDto
        {
            RunningTimer = runningTimer,
            WeeklyHours = weeklyMinutes / 60.0,
            MonthlyHours = monthlyMinutes / 60.0,
            MonthlyIncome = monthlyIncome,
            MonthlyExpenses = monthlyExpenses,
            ActiveProjectsCount = activeProjectsCount,
            TimeDistribution = timeDistribution,
            MonthlyFlow = monthlyFlow,
            ProductivityHeatmap = productivityHeatmap
        };
    }

    /// <inheritdoc />
    public async Task<List<TimeDistributionDto>> GetTimeDistributionAsync(int userId, DateTime startDate, DateTime endDate)
    {
        var entries = await _context.TimeEntries
            .Include(te => te.Project)
            .Where(te => te.UserId == userId
                && te.StartTime >= startDate
                && te.StartTime <= endDate
                && te.DurationMinutes.HasValue
                && te.ProjectId.HasValue)
            .ToListAsync();

        var totalMinutes = entries.Sum(e => e.DurationMinutes ?? 0);
        if (totalMinutes == 0) return new List<TimeDistributionDto>();

        var distribution = entries
            .GroupBy(e => e.ProjectId)
            .Select(g =>
            {
                var project = g.First().Project!;
                var projectMinutes = g.Sum(e => e.DurationMinutes ?? 0);
                return new TimeDistributionDto
                {
                    ProjectId = project.Id,
                    ProjectName = project.Name,
                    ColorCode = project.ColorCode,
                    TotalHours = projectMinutes / 60.0,
                    Percentage = (double)projectMinutes / totalMinutes * 100
                };
            })
            .OrderByDescending(d => d.TotalHours)
            .ToList();

        return distribution;
    }

    /// <inheritdoc />
    public async Task<List<MonthlyFlowDto>> GetMonthlyFlowAsync(int userId, int months = 12)
    {
        var now = DateTime.UtcNow;
        var startDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));

        var transactions = await _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date >= startDate)
            .ToListAsync();

        var result = new List<MonthlyFlowDto>();

        for (int i = 0; i < months; i++)
        {
            var monthStart = startDate.AddMonths(i);
            var monthEnd = monthStart.AddMonths(1);

            var monthTransactions = transactions
                .Where(t => t.Date >= monthStart && t.Date < monthEnd)
                .ToList();

            result.Add(new MonthlyFlowDto
            {
                Month = monthStart.Month,
                Year = monthStart.Year,
                Label = monthStart.ToString("MMM yyyy"),
                Income = monthTransactions.Where(t => t.Category.Type == TransactionType.Income).Sum(t => t.Amount),
                Expenses = monthTransactions.Where(t => t.Category.Type == TransactionType.Expense).Sum(t => t.Amount)
            });
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<List<DailyProductivityDto>> GetProductivityHeatmapAsync(int userId, int year)
    {
        var startDate = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = new DateTime(year, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        var entries = await _context.TimeEntries
            .Where(te => te.UserId == userId
                && te.StartTime >= startDate
                && te.StartTime <= endDate
                && te.DurationMinutes.HasValue)
            .ToListAsync();

        // Group by date
        var dailyData = entries
            .GroupBy(e => e.StartTime.Date)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.DurationMinutes ?? 0) / 60.0);

        // Generate all days of the year
        var result = new List<DailyProductivityDto>();
        var currentDate = startDate;
        var today = DateTime.UtcNow.Date;

        while (currentDate <= endDate && currentDate <= today)
        {
            var hours = dailyData.TryGetValue(currentDate.Date, out var h) ? h : 0;
            result.Add(new DailyProductivityDto
            {
                Date = currentDate,
                Hours = hours,
                IntensityLevel = GetIntensityLevel(hours)
            });
            currentDate = currentDate.AddDays(1);
        }

        return result;
    }

    /// <summary>
    /// Calculates intensity level for heatmap coloring (0-4).
    /// </summary>
    /// <param name="hours">Hours worked.</param>
    /// <returns>Intensity level.</returns>
    private static int GetIntensityLevel(double hours)
    {
        return hours switch
        {
            0 => 0,
            < 2 => 1,
            < 4 => 2,
            < 6 => 3,
            _ => 4
        };
    }
}
