using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;
using LifeSyncTracker.API.Models.DTOs.Auth.Response;
using LifeSyncTracker.API.Models.DTOs.Auth.Request;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of authentication service.
/// </summary>
public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly int AccessTokenExpiryMinutes;
    private readonly int RefreshTokenExpiryDays;

    /// <summary>
    /// Initializes a new instance of the AuthService.
    /// </summary>
    /// <param name="context">Database context.</param>
    /// <param name="configuration">Application configuration.</param>
    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        AccessTokenExpiryMinutes = _configuration.GetValue("Jwt:AccessTokenExpiryMinutes", 15);
        RefreshTokenExpiryDays = _configuration.GetValue("RefreshToken:ExpiryDays", 7);
    }

    /// <inheritdoc />
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string deviceIdentifier)
    {
        // Check if username already exists
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
        {
            throw new InvalidOperationException("Username already exists.");
        }

        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            throw new InvalidOperationException("Email already exists.");
        }

        // Create user
        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate tokens and return response
        return await GenerateAuthResponseAsync(user, deviceIdentifier);
    }

    /// <inheritdoc />
    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string deviceIdentifier)
    {
        // Find user by username or email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == dto.UsernameOrEmail || u.Email == dto.UsernameOrEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        return await GenerateAuthResponseAsync(user, deviceIdentifier);
    }

    /// <inheritdoc />
    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, string deviceIdentifier)
    {
        // Extract user principal from the expired access token
        var principal = GetPrincipalFromExpiredToken(dto.AccessToken);
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid access token.");
        }

        // Find the stored refresh token by composite key (userId + deviceIdentifier)
        var storedToken = await _context.RefreshTokens
            .FindAsync(userId, deviceIdentifier);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow
            || storedToken.Token != dto.RefreshToken)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        // Find user
        var user = await _context.Users.FindAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        // Generate new tokens (replaces the existing row for this user+device)
        return await GenerateAuthResponseAsync(user, deviceIdentifier);
    }

    /// <inheritdoc />
    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email
        };
    }

    /// <summary>
    /// Generates JWT token, refresh token, and authentication response.
    /// </summary>
    /// <param name="user">User entity.</param>
    /// <param name="deviceIdentifier">Device identifier for the refresh token.</param>
    /// <returns>Authentication response with tokens.</returns>
    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, string deviceIdentifier)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(AccessTokenExpiryMinutes);
        var accessToken = GenerateJwtToken(user, expiresAt);
        var refreshToken = await CreateOrUpdateRefreshTokenAsync(user.Id, deviceIdentifier);

        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email
            }
        };
    }

    /// <summary>
    /// Creates or replaces the refresh token for a given user and device.
    /// If a token already exists for the composite key (UserId, DeviceIdentifier), it is updated in place.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="deviceIdentifier">Device identifier.</param>
    /// <returns>The created or updated refresh token entity.</returns>
    private async Task<RefreshToken> CreateOrUpdateRefreshTokenAsync(int userId, string deviceIdentifier)
    {
        var existingToken = await _context.RefreshTokens.FindAsync(userId, deviceIdentifier);

        if (existingToken != null)
        {
            existingToken.Token = GenerateSecureToken();
            existingToken.CreatedAt = DateTime.UtcNow;
            existingToken.ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays);
            existingToken.IsRevoked = false;

            await _context.SaveChangesAsync();
            return existingToken;
        }

        var refreshToken = new RefreshToken
        {
            UserId = userId,
            DeviceIdentifier = deviceIdentifier,
            Token = GenerateSecureToken(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return refreshToken;
    }

    /// <summary>
    /// Generates a cryptographically secure random token string.
    /// </summary>
    /// <returns>A base64-encoded secure token.</returns>
    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    /// <summary>
    /// Extracts the ClaimsPrincipal from an expired JWT token without validating its lifetime.
    /// </summary>
    /// <param name="token">The expired JWT token.</param>
    /// <returns>The ClaimsPrincipal extracted from the token.</returns>
    private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = false,
            ValidIssuer = _configuration["Jwt:Issuer"],
            ValidAudience = _configuration["Jwt:Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new UnauthorizedAccessException("Invalid token.");
        }

        return principal;
    }

    /// <summary>
    /// Generates a JWT token for the user.
    /// </summary>
    /// <param name="user">User entity.</param>
    /// <param name="expiresAt">Token expiration time.</param>
    /// <returns>JWT token string.</returns>
    private string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
