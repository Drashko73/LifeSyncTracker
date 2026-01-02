using LifeSyncTracker.API.Models.DTOs;

namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for project management operations.
/// </summary>
public interface IProjectService
{
    /// <summary>
    /// Gets all projects for a user.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="includeInactive">Whether to include inactive projects.</param>
    /// <returns>List of projects.</returns>
    Task<List<ProjectDto>> GetAllAsync(int userId, bool includeInactive = false);

    /// <summary>
    /// Gets a project by ID.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="projectId">Project ID.</param>
    /// <returns>Project information.</returns>
    Task<ProjectDto?> GetByIdAsync(int userId, int projectId);

    /// <summary>
    /// Creates a new project.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Project data.</param>
    /// <returns>Created project.</returns>
    Task<ProjectDto> CreateAsync(int userId, CreateProjectDto dto);

    /// <summary>
    /// Updates a project.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="projectId">Project ID.</param>
    /// <param name="dto">Updated project data.</param>
    /// <returns>Updated project.</returns>
    Task<ProjectDto?> UpdateAsync(int userId, int projectId, UpdateProjectDto dto);

    /// <summary>
    /// Deletes a project.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="projectId">Project ID.</param>
    /// <returns>True if deleted successfully.</returns>
    Task<bool> DeleteAsync(int userId, int projectId);
}
