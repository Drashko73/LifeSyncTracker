using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of time entry service.
/// </summary>
public class TimeEntryService : ITimeEntryService
{
    private readonly ApplicationDbContext _context;
    private readonly ITransactionService _transactionService;

    /// <summary>
    /// Initializes a new instance of the TimeEntryService.
    /// </summary>
    /// <param name="context">Database context.</param>
    /// <param name="transactionService">Transaction service for auto-generating income.</param>
    public TimeEntryService(ApplicationDbContext context, ITransactionService transactionService)
    {
        _context = context;
        _transactionService = transactionService;
    }

    /// <inheritdoc />
    public async Task<PaginatedResponse<TimeEntryDto>> GetAllAsync(int userId, TimeEntryFilterDto filter)
    {
        var query = _context.TimeEntries
            .Include(te => te.Project)
            .Include(te => te.Tags)
            .Where(te => te.UserId == userId);

        // Apply filters
        if (filter.ProjectId.HasValue)
        {
            query = query.Where(te => te.ProjectId == filter.ProjectId);
        }

        if (filter.StartDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            var endDate = filter.EndDate.Value.Date.AddDays(1);
            query = query.Where(te => te.StartTime < endDate);
        }

        if (filter.TagIds != null && filter.TagIds.Count > 0)
        {
            query = query.Where(te => te.Tags.Any(t => filter.TagIds.Contains(t.Id)));
        }

        var totalCount = await query.CountAsync();

        var entries = await query
            .OrderByDescending(te => te.StartTime)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PaginatedResponse<TimeEntryDto>
        {
            Items = entries.Select(MapToDto).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    /// <inheritdoc />
    public async Task<TimeEntryDto?> GetByIdAsync(int userId, int entryId)
    {
        var entry = await _context.TimeEntries
            .Include(te => te.Project)
            .Include(te => te.Tags)
            .FirstOrDefaultAsync(te => te.Id == entryId && te.UserId == userId);

        return entry != null ? MapToDto(entry) : null;
    }

    /// <inheritdoc />
    public async Task<TimeEntryDto?> GetRunningTimerAsync(int userId)
    {
        var entry = await _context.TimeEntries
            .Include(te => te.Project)
            .Include(te => te.Tags)
            .FirstOrDefaultAsync(te => te.UserId == userId && te.IsRunning);

        return entry != null ? MapToDto(entry) : null;
    }

    /// <inheritdoc />
    public async Task<TimeEntryDto> StartTimerAsync(int userId, StartTimerDto dto)
    {
        // Check if there's already a running timer
        var runningTimer = await _context.TimeEntries
            .FirstOrDefaultAsync(te => te.UserId == userId && te.IsRunning);

        if (runningTimer != null)
        {
            throw new InvalidOperationException("A timer is already running. Stop it first.");
        }

        var entry = new TimeEntry
        {
            StartTime = DateTime.UtcNow,
            IsRunning = true,
            ProjectId = dto.ProjectId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        // Load project if set
        if (entry.ProjectId.HasValue)
        {
            await _context.Entry(entry).Reference(e => e.Project).LoadAsync();
        }

        return MapToDto(entry);
    }

    /// <inheritdoc />
    public async Task<TimeEntryDto?> StopTimerAsync(int userId, StopTimerDto dto)
    {
        var entry = await _context.TimeEntries
            .Include(te => te.Project)
            .FirstOrDefaultAsync(te => te.UserId == userId && te.IsRunning);

        if (entry == null) return null;

        entry.EndTime = DateTime.UtcNow;
        entry.IsRunning = false;
        entry.DurationMinutes = (int)(entry.EndTime.Value - entry.StartTime).TotalMinutes;
        entry.Description = dto.Description;
        entry.NextSteps = dto.NextSteps;
        entry.UpdatedAt = DateTime.UtcNow;

        // Update project if provided
        if (dto.ProjectId.HasValue)
        {
            entry.ProjectId = dto.ProjectId;
            await _context.Entry(entry).Reference(e => e.Project).LoadAsync();
        }

        // Add tags
        if (dto.TagIds.Count > 0)
        {
            var tags = await _context.Tags
                .Where(t => t.UserId == userId && dto.TagIds.Contains(t.Id))
                .ToListAsync();
            entry.Tags = tags;
        }

        await _context.SaveChangesAsync();

        // Auto-generate income if project has hourly rate and auto-create is enabled
        await TryCreateAutoIncomeAsync(userId, entry);

        return MapToDto(entry);
    }

    /// <inheritdoc />
    public async Task<TimeEntryDto> CreateManualEntryAsync(int userId, CreateTimeEntryDto dto)
    {
        // Validate times
        if (dto.EndTime <= dto.StartTime)
        {
            throw new InvalidOperationException("End time must be after start time.");
        }

        // Check for overlapping entries
        var overlaps = await CheckOverlapsAsync(userId, dto.StartTime, dto.EndTime, null);
        if (overlaps)
        {
            throw new InvalidOperationException("This time entry overlaps with an existing entry.");
        }

        var entry = new TimeEntry
        {
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            DurationMinutes = (int)(dto.EndTime - dto.StartTime).TotalMinutes,
            Description = dto.Description,
            NextSteps = dto.NextSteps,
            IsRunning = false,
            ProjectId = dto.ProjectId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Add tags
        if (dto.TagIds.Count > 0)
        {
            var tags = await _context.Tags
                .Where(t => t.UserId == userId && dto.TagIds.Contains(t.Id))
                .ToListAsync();
            entry.Tags = tags;
        }

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        // Load project
        if (entry.ProjectId.HasValue)
        {
            await _context.Entry(entry).Reference(e => e.Project).LoadAsync();
        }

        // Auto-generate income
        await TryCreateAutoIncomeAsync(userId, entry);

        return MapToDto(entry);
    }

    /// <inheritdoc />
    public async Task<TimeEntryDto?> UpdateAsync(int userId, int entryId, UpdateTimeEntryDto dto)
    {
        var entry = await _context.TimeEntries
            .Include(te => te.Project)
            .Include(te => te.Tags)
            .FirstOrDefaultAsync(te => te.Id == entryId && te.UserId == userId);

        if (entry == null) return null;

        var startTime = dto.StartTime ?? entry.StartTime;
        var endTime = dto.EndTime ?? entry.EndTime;

        // Validate times if both are set
        if (endTime.HasValue && endTime <= startTime)
        {
            throw new InvalidOperationException("End time must be after start time.");
        }

        // Check for overlaps
        if (endTime.HasValue)
        {
            var overlaps = await CheckOverlapsAsync(userId, startTime, endTime.Value, entryId);
            if (overlaps)
            {
                throw new InvalidOperationException("This time entry overlaps with an existing entry.");
            }
        }

        if (dto.StartTime.HasValue) entry.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue)
        {
            entry.EndTime = dto.EndTime.Value;
            entry.DurationMinutes = (int)(entry.EndTime.Value - entry.StartTime).TotalMinutes;
        }
        if (dto.ProjectId.HasValue) entry.ProjectId = dto.ProjectId;
        if (dto.Description != null) entry.Description = dto.Description;
        if (dto.NextSteps != null) entry.NextSteps = dto.NextSteps;

        // Update tags if provided
        if (dto.TagIds != null)
        {
            var tags = await _context.Tags
                .Where(t => t.UserId == userId && dto.TagIds.Contains(t.Id))
                .ToListAsync();
            entry.Tags.Clear();
            foreach (var tag in tags)
            {
                entry.Tags.Add(tag);
            }
        }

        entry.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Reload project
        if (entry.ProjectId.HasValue)
        {
            await _context.Entry(entry).Reference(e => e.Project).LoadAsync();
        }

        return MapToDto(entry);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int entryId)
    {
        var entry = await _context.TimeEntries
            .FirstOrDefaultAsync(te => te.Id == entryId && te.UserId == userId);

        if (entry == null) return false;

        _context.TimeEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<EmployerReportDto?> GetEmployerReportAsync(int userId, int projectId, int year, int month)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null) return null;

        var periodStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var periodEnd = periodStart.AddMonths(1);

        var entries = await _context.TimeEntries
            .Include(te => te.Tags)
            .Where(te => te.ProjectId == projectId
                && te.UserId == userId
                && te.StartTime >= periodStart
                && te.StartTime < periodEnd
                && !te.IsRunning)
            .OrderBy(te => te.StartTime)
            .ToListAsync();

        var totalMinutes = entries.Sum(e => e.DurationMinutes ?? 0);
        var totalHours = totalMinutes / 60.0;
        decimal? totalEarnings = project.HourlyRate.HasValue
            ? (decimal)totalHours * project.HourlyRate.Value
            : null;

        return new EmployerReportDto
        {
            Project = new ProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                ColorCode = project.ColorCode,
                HourlyRate = project.HourlyRate,
                AutoCreateIncome = project.AutoCreateIncome,
                Description = project.Description,
                IsActive = project.IsActive,
                CreatedAt = project.CreatedAt,
                TotalHours = totalHours
            },
            PeriodStart = periodStart,
            PeriodEnd = periodEnd.AddDays(-1),
            TotalHours = totalHours,
            TotalEarnings = totalEarnings,
            TimeEntries = entries.Select(MapToDto).ToList()
        };
    }

    /// <summary>
    /// Checks if a time range overlaps with existing entries.
    /// </summary>
    private async Task<bool> CheckOverlapsAsync(int userId, DateTime startTime, DateTime endTime, int? excludeEntryId)
    {
        var query = _context.TimeEntries
            .Where(te => te.UserId == userId
                && te.EndTime.HasValue
                && ((te.StartTime < endTime && te.EndTime > startTime)));

        if (excludeEntryId.HasValue)
        {
            query = query.Where(te => te.Id != excludeEntryId);
        }

        return await query.AnyAsync();
    }

    /// <summary>
    /// Tries to create an automatic income transaction for a time entry.
    /// </summary>
    private async Task TryCreateAutoIncomeAsync(int userId, TimeEntry entry)
    {
        if (entry.ProjectId == null || !entry.DurationMinutes.HasValue) return;

        var project = entry.Project ?? await _context.Projects.FindAsync(entry.ProjectId);
        if (project == null || !project.HourlyRate.HasValue || !project.AutoCreateIncome) return;

        var hours = entry.DurationMinutes.Value / 60.0;
        var amount = (decimal)hours * project.HourlyRate.Value;

        // Find or use the "Freelance" income category
        var category = await _context.TransactionCategories
            .FirstOrDefaultAsync(c => c.Name == "Freelance" && c.IsSystem);

        if (category == null) return;

        var transaction = new Transaction
        {
            Amount = amount,
            Date = entry.EndTime ?? entry.StartTime,
            CategoryId = category.Id,
            UserId = userId,
            LinkedTimeEntryId = entry.Id,
            IsAutoGenerated = true,
            Description = $"Auto-generated from time entry for {project.Name}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Maps a time entry entity to a DTO.
    /// </summary>
    private static TimeEntryDto MapToDto(TimeEntry entry)
    {
        return new TimeEntryDto
        {
            Id = entry.Id,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            DurationMinutes = entry.DurationMinutes,
            Description = entry.Description,
            NextSteps = entry.NextSteps,
            IsRunning = entry.IsRunning,
            CreatedAt = entry.CreatedAt,
            Project = entry.Project != null ? new ProjectDto
            {
                Id = entry.Project.Id,
                Name = entry.Project.Name,
                ColorCode = entry.Project.ColorCode,
                HourlyRate = entry.Project.HourlyRate,
                AutoCreateIncome = entry.Project.AutoCreateIncome,
                Description = entry.Project.Description,
                IsActive = entry.Project.IsActive,
                CreatedAt = entry.Project.CreatedAt
            } : null,
            Tags = entry.Tags.Select(t => new TagDto
            {
                Id = t.Id,
                Name = t.Name,
                ColorCode = t.ColorCode,
                CreatedAt = t.CreatedAt
            }).ToList()
        };
    }
}
