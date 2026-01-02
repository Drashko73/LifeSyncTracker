using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Services.Interfaces;

namespace LifeSyncTracker.API.Controllers;

/// <summary>
/// Controller for tag management operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    /// <summary>
    /// Initializes a new instance of the TagsController.
    /// </summary>
    /// <param name="tagService">Tag service.</param>
    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    /// <summary>
    /// Gets all tags for the current user.
    /// </summary>
    /// <returns>List of tags.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<TagDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<TagDto>>>> GetAll()
    {
        var userId = GetUserId();
        var tags = await _tagService.GetAllAsync(userId);
        return Ok(ApiResponse<List<TagDto>>.SuccessResponse(tags));
    }

    /// <summary>
    /// Gets a tag by ID.
    /// </summary>
    /// <param name="id">Tag ID.</param>
    /// <returns>Tag information.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TagDto>>> GetById(int id)
    {
        var userId = GetUserId();
        var tag = await _tagService.GetByIdAsync(userId, id);

        if (tag == null)
        {
            return NotFound(ApiResponse<TagDto>.ErrorResponse("Tag not found."));
        }

        return Ok(ApiResponse<TagDto>.SuccessResponse(tag));
    }

    /// <summary>
    /// Creates a new tag.
    /// </summary>
    /// <param name="dto">Tag data.</param>
    /// <returns>Created tag.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TagDto>>> Create([FromBody] CreateTagDto dto)
    {
        try
        {
            var userId = GetUserId();
            var tag = await _tagService.CreateAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = tag.Id }, ApiResponse<TagDto>.SuccessResponse(tag, "Tag created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TagDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Updates a tag.
    /// </summary>
    /// <param name="id">Tag ID.</param>
    /// <param name="dto">Updated tag data.</param>
    /// <returns>Updated tag.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TagDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TagDto>>> Update(int id, [FromBody] UpdateTagDto dto)
    {
        try
        {
            var userId = GetUserId();
            var tag = await _tagService.UpdateAsync(userId, id, dto);

            if (tag == null)
            {
                return NotFound(ApiResponse<TagDto>.ErrorResponse("Tag not found."));
            }

            return Ok(ApiResponse<TagDto>.SuccessResponse(tag, "Tag updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TagDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Deletes a tag.
    /// </summary>
    /// <param name="id">Tag ID.</param>
    /// <returns>Success status.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetUserId();
        var deleted = await _tagService.DeleteAsync(userId, id);

        if (!deleted)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Tag not found."));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, "Tag deleted successfully."));
    }

    /// <summary>
    /// Gets the user ID from the JWT token claims.
    /// </summary>
    /// <returns>User ID.</returns>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
}
