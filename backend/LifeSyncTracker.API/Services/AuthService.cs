using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using LifeSyncTracker.API.Data;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services.Interfaces;
using LifeSyncTracker.API.Models.DTOs.Auth.Response;
using LifeSyncTracker.API.Models.DTOs.Auth.Request;
using LifeSyncTracker.API.Models.Options;
using LifeSyncTracker.API.Exceptions;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Implementation of authentication service.
/// </summary>
public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly AesEncryptionService _encryptionService;
    private readonly IEmailService _emailService;
    private readonly EmailVerificationOptions _emailVerificationOptions;
    private readonly int AccessTokenExpiryMinutes;
    private readonly int RefreshTokenExpiryDays;

    /// <summary>
    /// Initializes a new instance of the AuthService.
    /// </summary>
    /// <param name="context">Database context.</param>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="encryptionService">AES encryption service for computing blind indexes.</param>
    /// <param name="emailService">Email delivery service.</param>
    /// <param name="emailVerificationOptions">Email verification settings.</param>
    public AuthService(
        ApplicationDbContext context,
        IConfiguration configuration,
        AesEncryptionService encryptionService,
        IEmailService emailService,
        IOptions<EmailVerificationOptions> emailVerificationOptions)
    {
        _context = context;
        _configuration = configuration;
        _encryptionService = encryptionService;
        _emailService = emailService;
        _emailVerificationOptions = emailVerificationOptions.Value;
        if (_emailVerificationOptions.CodeLength < 1 || _emailVerificationOptions.CodeLength > 9)
        {
            throw new InvalidOperationException("Email verification code length must be between 1 and 9.");
        }

        if (_emailVerificationOptions.ExpirationMinutes <= 0)
        {
            throw new InvalidOperationException("Email verification expiration must be greater than 0.");
        }

        AccessTokenExpiryMinutes = _configuration.GetValue("Jwt:AccessTokenExpiryMinutes", 15);
        RefreshTokenExpiryDays = _configuration.GetValue("RefreshToken:ExpiryDays", 7);
    }

    /// <inheritdoc />
    public async Task SendVerificationCodeAsync(SendVerificationCodeDto dto)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        var now = DateTime.UtcNow;

        var activeToken = await _context.EmailVerificationTokens
            .Where(token => token.Email == normalizedEmail && !token.IsUsed && token.ExpiresAt > now)
            .OrderByDescending(token => token.RequestedAt)
            .FirstOrDefaultAsync();

        if (activeToken != null)
        {
            var waitTime = activeToken.ExpiresAt - now;
            var waitSeconds = Math.Max(1, (int)Math.Ceiling(waitTime.TotalSeconds));
            throw new TooManyRequestsException($"A verification code is already active for this email. Please wait {waitSeconds} seconds (until {activeToken.ExpiresAt:O}) before requesting a new one.");
        }

        var code = GenerateVerificationCode(_emailVerificationOptions.CodeLength);
        var verificationToken = new EmailVerificationToken
        {
            Email = normalizedEmail,
            Code = HashVerificationCode(code),
            RequestedAt = now,
            ExpiresAt = now.AddMinutes(_emailVerificationOptions.ExpirationMinutes),
            IsUsed = false
        };

        _context.EmailVerificationTokens.Add(verificationToken);
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendVerificationCodeAsync(normalizedEmail, code, _emailVerificationOptions.ExpirationMinutes);
        }
        catch
        {
            _context.EmailVerificationTokens.Remove(verificationToken);
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Failed to send verification code. Please try again.");
        }
    }

    /// <inheritdoc />
    public async Task VerifyCodeAsync(VerifyCodeDto dto)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        await ValidateVerificationCodeAsync(normalizedEmail, dto.Code);
    }

    /// <inheritdoc />
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string deviceIdentifier)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        await EnsureCodeEmailMatchAsync(normalizedEmail, dto.Code);
        var verificationToken = await ValidateVerificationCodeAsync(normalizedEmail, dto.Code);
        var usernameHash = _encryptionService.ComputeBlindIndex(dto.Username);
        var emailHash = _encryptionService.ComputeBlindIndex(normalizedEmail);
        var rawEmailHash = _encryptionService.ComputeBlindIndex(dto.Email);

        // Check if username already exists (by blind index)
        if (await _context.Users.AnyAsync(u => u.UsernameHash == usernameHash))
        {
            throw new InvalidOperationException("Username: Username already exists.");
        }

        // Check if email already exists (by blind index)
        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash || u.EmailHash == rawEmailHash))
        {
            throw new InvalidOperationException("Email: Email already exists.");
        }

        // Create user
        var user = new User
        {
            Username = dto.Username,
            UsernameHash = usernameHash,
            Email = normalizedEmail,
            EmailHash = emailHash,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        verificationToken.IsUsed = true;
        verificationToken.UsedAt = DateTime.UtcNow;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate tokens and return response
        return await GenerateAuthResponseAsync(user, deviceIdentifier);
    }

    /// <inheritdoc />
    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string deviceIdentifier)
    {
        // Compute blind index of the provided credential
        var credentialHash = _encryptionService.ComputeBlindIndex(dto.UsernameOrEmail);
        var normalizedCredentialHash = _encryptionService.ComputeBlindIndex(NormalizeEmail(dto.UsernameOrEmail));

        // Find user by blind index on username or email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UsernameHash == credentialHash || u.EmailHash == credentialHash || u.EmailHash == normalizedCredentialHash);

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
            Email = user.Email,
            Created = user.CreatedAt,
            Updated = user.UpdatedAt ?? user.CreatedAt
        };
    }

    /// <inheritdoc />
    public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto)
    {
        // Check if user exists
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return;

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
        {
            throw new InvalidOperationException("Current password is incorrect.");
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
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
                Email = user.Email,
                Created = user.CreatedAt,
                Updated = user.UpdatedAt ?? user.CreatedAt
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
    /// Generates a cryptographically secure numeric verification code.
    /// </summary>
    /// <param name="codeLength">Number of digits in code.</param>
    /// <returns>Numeric verification code.</returns>
    private static string GenerateVerificationCode(int codeLength)
    {
        var max = (int)Math.Pow(10, codeLength);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString($"D{codeLength}");
    }

    /// <summary>
    /// Validates a verification code against the most recent token for an email.
    /// </summary>
    /// <param name="normalizedEmail">Normalized email address.</param>
    /// <param name="code">Submitted code.</param>
    /// <returns>The matching verification token.</returns>
    private async Task<EmailVerificationToken> ValidateVerificationCodeAsync(string normalizedEmail, string code)
    {
        var token = await _context.EmailVerificationTokens
            .Where(t => t.Email == normalizedEmail)
            .OrderByDescending(t => t.RequestedAt)
            .FirstOrDefaultAsync();

        if (token == null)
        {
            throw new InvalidOperationException("Email: No verification code found for this email. Request a new code.");
        }

        if (token.IsUsed)
        {
            throw new InvalidOperationException("Code: This verification code was already used.");
        }

        if (token.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Code: This verification code has expired. Request a new code.");
        }

        if (!CodesMatchConstantTime(code, token.Code))
        {
            throw new InvalidOperationException("Code: The verification code is incorrect.");
        }

        return token;
    }

    /// <summary>
    /// Ensures the submitted code belongs to the submitted email.
    /// </summary>
    /// <param name="normalizedEmail">Normalized email address.</param>
    /// <param name="code">Submitted code.</param>
    private async Task EnsureCodeEmailMatchAsync(string normalizedEmail, string code)
    {
        var codeHash = HashVerificationCode(code);
        var now = DateTime.UtcNow;
        var tokenByCode = await _context.EmailVerificationTokens
            .Where(t => t.Code == codeHash && !t.IsUsed && t.ExpiresAt > now)
            .OrderByDescending(t => t.RequestedAt)
            .FirstOrDefaultAsync();

        if (tokenByCode != null && tokenByCode.Email != normalizedEmail)
        {
            throw new InvalidOperationException("Email: The verification code does not match the provided email.");
        }
    }

    /// <summary>
    /// Hashes a verification code before persistence or comparison.
    /// </summary>
    /// <param name="code">Plain text verification code.</param>
    /// <returns>Base64 SHA-256 hash.</returns>
    private static string HashVerificationCode(string code)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// Compares a plain text code to a hashed code in constant time.
    /// </summary>
    /// <param name="plainCode">User supplied code.</param>
    /// <param name="storedHashedCode">Persisted hash.</param>
    /// <returns>True when equal.</returns>
    private static bool CodesMatchConstantTime(string plainCode, string storedHashedCode)
    {
        var computedHash = HashVerificationCode(plainCode);
        var expectedBytes = Encoding.UTF8.GetBytes(storedHashedCode);
        var actualBytes = Encoding.UTF8.GetBytes(computedHash);

        if (expectedBytes.Length != actualBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }

    /// <summary>
    /// Normalizes email for persistence and comparisons.
    /// </summary>
    /// <param name="email">Email address.</param>
    /// <returns>Lower-cased trimmed email.</returns>
    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
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
