using System.ComponentModel.DataAnnotations;

namespace LifeSyncTracker.API.Models.DTOs;

/// <summary>
/// DTO for user registration.
/// </summary>
public class RegisterDto
{
    /// <summary>
    /// Username for the new account.
    /// </summary>
    [Required]
    [MinLength(3)]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Email address for the new account.
    /// </summary>
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password for the new account.
    /// </summary>
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO for user login.
/// </summary>
public class LoginDto
{
    /// <summary>
    /// Username or email for login.
    /// </summary>
    [Required]
    public string UsernameOrEmail { get; set; } = string.Empty;

    /// <summary>
    /// Password for login.
    /// </summary>
    [Required]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO for authentication response.
/// </summary>
public class AuthResponseDto
{
    /// <summary>
    /// JWT access token.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Token expiration time.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// User information.
    /// </summary>
    public UserDto User { get; set; } = null!;
}

/// <summary>
/// DTO for user information.
/// </summary>
public class UserDto
{
    /// <summary>
    /// User ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Username.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;
}
