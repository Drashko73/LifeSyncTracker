using LifeSyncTracker.API.Models.DTOs;

namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for tag management operations.
/// </summary>
public interface ITagService
{
    /// <summary>
    /// Gets all tags for a user.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>List of tags.</returns>
    Task<List<TagDto>> GetAllAsync(int userId);

    /// <summary>
    /// Gets a tag by ID.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="tagId">Tag ID.</param>
    /// <returns>Tag information.</returns>
    Task<TagDto?> GetByIdAsync(int userId, int tagId);

    /// <summary>
    /// Creates a new tag.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Tag data.</param>
    /// <returns>Created tag.</returns>
    Task<TagDto> CreateAsync(int userId, CreateTagDto dto);

    /// <summary>
    /// Updates a tag.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="tagId">Tag ID.</param>
    /// <param name="dto">Updated tag data.</param>
    /// <returns>Updated tag.</returns>
    Task<TagDto?> UpdateAsync(int userId, int tagId, UpdateTagDto dto);

    /// <summary>
    /// Deletes a tag.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="tagId">Tag ID.</param>
    /// <returns>True if deleted successfully.</returns>
    Task<bool> DeleteAsync(int userId, int tagId);
}
