using LifeSyncTracker.API.Models.DTOs.Auth.Request;
using LifeSyncTracker.API.Models.DTOs.Auth.Response;

namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for authentication operations.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user.
    /// </summary>
    /// <param name="dto">Registration data.</param>
    /// <returns>Authentication response with token.</returns>
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);

    /// <summary>
    /// Authenticates a user.
    /// </summary>
    /// <param name="dto">Login credentials.</param>
    /// <returns>Authentication response with token.</returns>
    Task<AuthResponseDto> LoginAsync(LoginDto dto);

    /// <summary>
    /// Gets current user information.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>User information.</returns>
    Task<UserDto?> GetCurrentUserAsync(int userId);
}
