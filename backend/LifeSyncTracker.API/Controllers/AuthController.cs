using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeSyncTracker.API.Services.Interfaces;
using LifeSyncTracker.API.Models.DTOs.Auth.Response;
using LifeSyncTracker.API.Models.DTOs.Auth.Request;
using LifeSyncTracker.API.Models.DTOs.Common.Response;

namespace LifeSyncTracker.API.Controllers;

/// <summary>
/// Controller for authentication operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    private const string DeviceIdHeaderName = "X-Device-Id";

    /// <summary>
    /// Initializes a new instance of the AuthController.
    /// </summary>
    /// <param name="authService">Authentication service.</param>
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Registers a new user.
    /// </summary>
    /// <param name="dto">Registration data.</param>
    /// <returns>Authentication response with token.</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var deviceId = GetDeviceIdentifier();
            var result = await _authService.RegisterAsync(dto, deviceId);
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Registration successful."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token.
    /// </summary>
    /// <param name="dto">Login credentials.</param>
    /// <returns>Authentication response with token.</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var deviceId = GetDeviceIdentifier();
            var result = await _authService.LoginAsync(dto, deviceId);
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Login successful."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Refreshes access and refresh tokens using a valid refresh token.
    /// </summary>
    /// <param name="dto">The expired access token and current refresh token.</param>
    /// <returns>Authentication response with new tokens.</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        try
        {
            var deviceId = GetDeviceIdentifier();
            var result = await _authService.RefreshTokenAsync(dto, deviceId);
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Token refreshed successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Gets the current authenticated user's information.
    /// </summary>
    /// <returns>User information.</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        var userId = GetUserId();
        var user = await _authService.GetCurrentUserAsync(userId);

        if (user == null)
        {
            return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found."));
        }

        return Ok(ApiResponse<UserDto>.SuccessResponse(user));
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

    /// <summary>
    /// Gets the device identifier from the X-Device-Id request header.
    /// </summary>
    /// <returns>Device identifier string.</returns>
    /// <exception cref="InvalidOperationException">Thrown when the header is missing or empty.</exception>
    private string GetDeviceIdentifier()
    {
        if (!Request.Headers.TryGetValue(DeviceIdHeaderName, out var deviceId) || string.IsNullOrWhiteSpace(deviceId))
        {
            throw new InvalidOperationException($"The '{DeviceIdHeaderName}' header is required.");
        }

        return deviceId.ToString();
    }
}
