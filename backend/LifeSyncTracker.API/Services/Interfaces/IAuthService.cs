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
    /// <param name="deviceIdentifier">Device identifier from the request header.</param>
    /// <returns>Authentication response with token.</returns>
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string deviceIdentifier);

    /// <summary>
    /// Authenticates a user.
    /// </summary>
    /// <param name="dto">Login credentials.</param>
    /// <param name="deviceIdentifier">Device identifier from the request header.</param>
    /// <returns>Authentication response with token.</returns>
    Task<AuthResponseDto> LoginAsync(LoginDto dto, string deviceIdentifier);

    /// <summary>
    /// Refreshes access and refresh tokens.
    /// </summary>
    /// <param name="dto">The expired access token and current refresh token.</param>
    /// <param name="deviceIdentifier">Device identifier from the request header.</param>
    /// <returns>Authentication response with new tokens.</returns>
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, string deviceIdentifier);

    /// <summary>
    /// Gets current user information.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>User information.</returns>
    Task<UserDto?> GetCurrentUserAsync(int userId);

    /// <summary>
    /// Asynchronously changes the password for the specified user.
    /// </summary>
    /// <remarks>Throws an exception if the user ID is invalid or if the new password does not meet security
    /// requirements.</remarks>
    /// <param name="userId">The unique identifier of the user whose password is to be changed. Must correspond to an existing user.</param>
    /// <param name="dto">An object containing the new password and any required validation information for the password change. Cannot be
    /// null.</param>
    /// <returns>A task that represents the asynchronous password change operation.</returns>
    Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
}
