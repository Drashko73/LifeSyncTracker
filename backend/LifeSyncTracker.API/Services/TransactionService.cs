using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of transaction management service.
/// </summary>
public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Initializes a new instance of the TransactionService.
    /// </summary>
    /// <param name="context">Database context.</param>
    public TransactionService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<TransactionCategoryDto>> GetCategoriesAsync(int userId)
    {
        return await _context.TransactionCategories
            .Where(c => c.IsSystem || c.UserId == userId)
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Name)
            .Select(c => MapCategoryToDto(c))
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<TransactionCategoryDto> CreateCategoryAsync(int userId, CreateTransactionCategoryDto dto)
    {
        var category = new TransactionCategory
        {
            Name = dto.Name,
            Type = dto.Type,
            Icon = dto.Icon,
            ColorCode = dto.ColorCode,
            UserId = userId,
            IsSystem = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.TransactionCategories.Add(category);
        await _context.SaveChangesAsync();

        return MapCategoryToDto(category);
    }

    /// <inheritdoc />
    public async Task<TransactionCategoryDto?> UpdateCategoryAsync(int userId, int categoryId, UpdateTransactionCategoryDto dto)
    {
        var category = await _context.TransactionCategories
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId && !c.IsSystem);

        if (category == null) return null;

        if (dto.Name != null) category.Name = dto.Name;
        if (dto.Icon != null) category.Icon = dto.Icon;
        if (dto.ColorCode != null) category.ColorCode = dto.ColorCode;

        await _context.SaveChangesAsync();

        return MapCategoryToDto(category);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteCategoryAsync(int userId, int categoryId)
    {
        var category = await _context.TransactionCategories
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId && !c.IsSystem);

        if (category == null) return false;

        // Check if category has transactions
        var hasTransactions = await _context.Transactions.AnyAsync(t => t.CategoryId == categoryId);
        if (hasTransactions)
        {
            throw new InvalidOperationException("Cannot delete category with existing transactions.");
        }

        _context.TransactionCategories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<PaginatedResponse<TransactionDto>> GetTransactionsAsync(int userId, TransactionFilterDto filter)
    {
        var query = _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);

        // Apply filters
        if (filter.Type.HasValue)
        {
            query = query.Where(t => t.Category.Type == filter.Type);
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(t => t.CategoryId == filter.CategoryId);
        }

        if (filter.StartDate.HasValue)
        {
            query = query.Where(t => t.Date >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            var endDate = filter.EndDate.Value.Date.AddDays(1);
            query = query.Where(t => t.Date < endDate);
        }

        var totalCount = await query.CountAsync();

        var transactions = await query
            .OrderByDescending(t => t.Date)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PaginatedResponse<TransactionDto>
        {
            Items = transactions.Select(MapTransactionToDto).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    /// <inheritdoc />
    public async Task<TransactionDto?> GetTransactionByIdAsync(int userId, int transactionId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        return transaction != null ? MapTransactionToDto(transaction) : null;
    }

    /// <inheritdoc />
    public async Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto)
    {
        // Validate category
        var category = await _context.TransactionCategories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && (c.IsSystem || c.UserId == userId));

        if (category == null)
        {
            throw new InvalidOperationException("Invalid category.");
        }

        var transaction = new Transaction
        {
            Amount = dto.Amount,
            Currency = dto.Currency,
            Date = dto.Date,
            CategoryId = dto.CategoryId,
            Description = dto.Description,
            UserId = userId,
            IsAutoGenerated = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        transaction.Category = category;
        return MapTransactionToDto(transaction);
    }

    /// <inheritdoc />
    public async Task<TransactionDto?> UpdateTransactionAsync(int userId, int transactionId, UpdateTransactionDto dto)
    {
        var transaction = await _context.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        if (transaction == null) return null;

        if (dto.Amount.HasValue) transaction.Amount = dto.Amount.Value;
        if (dto.Currency.HasValue) transaction.Currency = dto.Currency.Value;
        if (dto.Date.HasValue) transaction.Date = dto.Date.Value;
        if (dto.Description != null) transaction.Description = dto.Description;

        if (dto.CategoryId.HasValue)
        {
            var category = await _context.TransactionCategories
                .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && (c.IsSystem || c.UserId == userId));

            if (category == null)
            {
                throw new InvalidOperationException("Invalid category.");
            }

            transaction.CategoryId = dto.CategoryId.Value;
            transaction.Category = category;
        }

        transaction.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapTransactionToDto(transaction);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteTransactionAsync(int userId, int transactionId)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        if (transaction == null) return false;

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<FinancialSummaryDto> GetSummaryAsync(int userId, DateTime startDate, DateTime endDate)
    {
        var transactions = await _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= endDate)
            .ToListAsync();

        var totalIncome = transactions
            .Where(t => t.Category.Type == TransactionType.Income)
            .Sum(t => t.Amount);

        var totalExpenses = transactions
            .Where(t => t.Category.Type == TransactionType.Expense)
            .Sum(t => t.Amount);

        return new FinancialSummaryDto
        {
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            NetBalance = totalIncome - totalExpenses,
            PeriodStart = startDate,
            PeriodEnd = endDate
        };
    }

    /// <summary>
    /// Maps a category entity to a DTO.
    /// </summary>
    private static TransactionCategoryDto MapCategoryToDto(TransactionCategory category)
    {
        return new TransactionCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Type = category.Type,
            Icon = category.Icon,
            ColorCode = category.ColorCode,
            IsSystem = category.IsSystem
        };
    }

    /// <summary>
    /// Maps a transaction entity to a DTO.
    /// </summary>
    private static TransactionDto MapTransactionToDto(Transaction transaction)
    {
        return new TransactionDto
        {
            Id = transaction.Id,
            Amount = transaction.Amount,
            Currency = transaction.Currency,
            Date = transaction.Date,
            Description = transaction.Description,
            IsAutoGenerated = transaction.IsAutoGenerated,
            LinkedTimeEntryId = transaction.LinkedTimeEntryId,
            CreatedAt = transaction.CreatedAt,
            Category = MapCategoryToDto(transaction.Category)
        };
    }
}
