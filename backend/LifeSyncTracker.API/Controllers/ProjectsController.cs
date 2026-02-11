using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Models.DTOs.Common.Response;
using LifeSyncTracker.API.Models.DTOs.Project.Request;
using LifeSyncTracker.API.Models.DTOs.Project.Response;
using LifeSyncTracker.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LifeSyncTracker.API.Controllers;

/// <summary>
/// Controller for project management operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    /// <summary>
    /// Initializes a new instance of the ProjectsController.
    /// </summary>
    /// <param name="projectService">Project service.</param>
    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    /// <summary>
    /// Gets all projects for the current user.
    /// </summary>
    /// <param name="includeInactive">Whether to include inactive projects.</param>
    /// <returns>List of projects.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<ProjectDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ProjectDto>>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var userId = GetUserId();
        var projects = await _projectService.GetAllAsync(userId, includeInactive);
        return Ok(ApiResponse<List<ProjectDto>>.SuccessResponse(projects));
    }

    /// <summary>
    /// Gets a project by ID.
    /// </summary>
    /// <param name="id">Project ID.</param>
    /// <returns>Project information.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> GetById(int id)
    {
        var userId = GetUserId();
        var project = await _projectService.GetByIdAsync(userId, id);

        if (project == null)
        {
            return NotFound(ApiResponse<ProjectDto>.ErrorResponse("Project not found."));
        }

        return Ok(ApiResponse<ProjectDto>.SuccessResponse(project));
    }

    /// <summary>
    /// Creates a new project.
    /// </summary>
    /// <param name="dto">Project data.</param>
    /// <returns>Created project.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> Create([FromBody] CreateProjectDto dto)
    {
        try
        {
            var userId = GetUserId();
            var project = await _projectService.CreateAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = project.Id }, ApiResponse<ProjectDto>.SuccessResponse(project, "Project created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TagDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Updates a project.
    /// </summary>
    /// <param name="id">Project ID.</param>
    /// <param name="dto">Updated project data.</param>
    /// <returns>Updated project.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> Update(int id, [FromBody] UpdateProjectDto dto)
    {
        var userId = GetUserId();
        var project = await _projectService.UpdateAsync(userId, id, dto);

        if (project == null)
        {
            return NotFound(ApiResponse<ProjectDto>.ErrorResponse("Project not found."));
        }

        return Ok(ApiResponse<ProjectDto>.SuccessResponse(project, "Project updated successfully."));
    }

    /// <summary>
    /// Deletes a project.
    /// </summary>
    /// <param name="id">Project ID.</param>
    /// <returns>Success status.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetUserId();
        var deleted = await _projectService.DeleteAsync(userId, id);

        if (!deleted)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Project not found."));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, "Project deleted successfully."));
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
