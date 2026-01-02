using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs;

/// <summary>
/// DTO for creating a new tag.
/// </summary>
public class CreateTagDto
{
    /// <summary>
    /// Name of the tag.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }
}

/// <summary>
/// DTO for updating a tag.
/// </summary>
public class UpdateTagDto
{
    /// <summary>
    /// Name of the tag.
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }
}

/// <summary>
/// DTO for tag response.
/// </summary>
public class TagDto
{
    /// <summary>
    /// Tag ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Name of the tag.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    public string? ColorCode { get; set; }

    /// <summary>
    /// Creation date.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
