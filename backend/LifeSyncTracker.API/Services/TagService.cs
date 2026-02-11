using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of tag management service.
/// </summary>
public class TagService : ITagService
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Initializes a new instance of the TagService.
    /// </summary>
    /// <param name="context">Database context.</param>
    public TagService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<TagDto>> GetAllAsync(int userId)
    {
        return await _context.Tags
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<TagDto?> GetByIdAsync(int userId, int tagId)
    {
        var tag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId);

        return tag != null ? MapToDto(tag) : null;
    }

    /// <inheritdoc />
    public async Task<TagDto> CreateAsync(int userId, CreateTagDto dto)
    {
        // Check if tag with same name already exists for user
        var exists = await _context.Tags
            .AnyAsync(t => t.UserId == userId && t.Name.ToLower().Equals(dto.Name.ToLower()));

        if (exists)
        {
            throw new InvalidOperationException("A tag with this name already exists.");
        }

        var tag = new Tag
        {
            Name = dto.Name,
            ColorCode = dto.ColorCode,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();

        return MapToDto(tag);
    }

    /// <inheritdoc />
    public async Task<TagDto?> UpdateAsync(int userId, int tagId, UpdateTagDto dto)
    {
        var tag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId);

        if (tag == null) return null;

        if (dto.Name != null)
        {
            // Check if new name already exists
            var exists = await _context.Tags
                .AnyAsync(t => t.UserId == userId && t.Name == dto.Name && t.Id != tagId);

            if (exists)
            {
                throw new InvalidOperationException("A tag with this name already exists.");
            }

            tag.Name = dto.Name;
        }

        if (dto.ColorCode != null) tag.ColorCode = dto.ColorCode;

        await _context.SaveChangesAsync();

        return MapToDto(tag);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int tagId)
    {
        var tag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId);

        if (tag == null) return false;

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Maps a tag entity to a DTO.
    /// </summary>
    /// <param name="tag">Tag entity.</param>
    /// <returns>Tag DTO.</returns>
    private static TagDto MapToDto(Tag tag)
    {
        return new TagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            ColorCode = tag.ColorCode,
            CreatedAt = tag.CreatedAt
        };
    }
}
