using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;
using LifeSyncTracker.API.Models.DTOs.Project.Response;
using LifeSyncTracker.API.Models.DTOs.Project.Request;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of project management service.
/// </summary>
public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Initializes a new instance of the ProjectService.
    /// </summary>
    /// <param name="context">Database context.</param>
    public ProjectService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<ProjectDto>> GetAllAsync(int userId, bool includeInactive = false)
    {
        var query = _context.Projects
            .Where(p => p.UserId == userId);

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        var projects = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = new List<ProjectDto>();
        foreach (var project in projects)
        {
            var totalMinutes = await _context.TimeEntries
                .Where(te => te.ProjectId == project.Id && te.DurationMinutes.HasValue)
                .SumAsync(te => te.DurationMinutes ?? 0);

            result.Add(MapToDto(project, totalMinutes / 60.0));
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<ProjectDto?> GetByIdAsync(int userId, int projectId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null) return null;

        var totalMinutes = await _context.TimeEntries
            .Where(te => te.ProjectId == project.Id && te.DurationMinutes.HasValue)
            .SumAsync(te => te.DurationMinutes ?? 0);

        return MapToDto(project, totalMinutes / 60.0);
    }

    /// <inheritdoc />
    public async Task<ProjectDto> CreateAsync(int userId, CreateProjectDto dto)
    {
        var project = new Project
        {
            Name = dto.Name,
            ColorCode = dto.ColorCode,
            HourlyRate = dto.HourlyRate,
            AutoCreateIncome = dto.AutoCreateIncome,
            Description = dto.Description,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return MapToDto(project, 0);
    }

    /// <inheritdoc />
    public async Task<ProjectDto?> UpdateAsync(int userId, int projectId, UpdateProjectDto dto)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null) return null;

        if (dto.Name != null) project.Name = dto.Name;
        if (dto.ColorCode != null) project.ColorCode = dto.ColorCode;
        if (dto.HourlyRate.HasValue) project.HourlyRate = dto.HourlyRate;
        if (dto.AutoCreateIncome.HasValue) project.AutoCreateIncome = dto.AutoCreateIncome.Value;
        if (dto.Description != null) project.Description = dto.Description;
        if (dto.IsActive.HasValue) project.IsActive = dto.IsActive.Value;
        
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var totalMinutes = await _context.TimeEntries
            .Where(te => te.ProjectId == project.Id && te.DurationMinutes.HasValue)
            .SumAsync(te => te.DurationMinutes ?? 0);

        return MapToDto(project, totalMinutes / 60.0);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int projectId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null) return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Maps a project entity to a DTO.
    /// </summary>
    /// <param name="project">Project entity.</param>
    /// <param name="totalHours">Total hours tracked.</param>
    /// <returns>Project DTO.</returns>
    private static ProjectDto MapToDto(Project project, double totalHours)
    {
        return new ProjectDto
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
        };
    }
}
