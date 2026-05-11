using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.DTOs.Statistics.Response;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LifeSyncTracker.API.Services
{
    public class StatsService : IStatsService
    {
        private readonly ApplicationDbContext _context;
        private readonly AesEncryptionService _encryptionService;

        public StatsService(ApplicationDbContext context, AesEncryptionService encryptionService)
        {
            _context = context;
            _encryptionService = encryptionService;
        }

        public async Task<StatsDto> GetOverallStatsAsync()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalMinutesTracked = await _context.TimeEntries.SumAsync(te => te.DurationMinutes);
            var totalIncomeTracked = await _context.Transactions.Where(t => t.Category.Type == TransactionType.Income).ToListAsync();
            var totalExpenseTracked = await _context.Transactions.Where(t => t.Category.Type == TransactionType.Expense).ToListAsync();

            return new StatsDto
            {
                TotalNumberOfUsers = totalUsers,
                TotalNumberOfHoursTracked = (int)(totalMinutesTracked / 60),
                TotalIncomeTracked = totalIncomeTracked.Sum(t => t.Amount),
                TotalExpensesTracked = totalExpenseTracked.Sum(t => t.Amount)
            };
        }
    }
}
