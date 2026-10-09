namespace LifeSyncTracker.API.Models.Options;

/// <summary>
/// Settings for email verification flow.
/// </summary>
public class EmailVerificationOptions
{
    public const string SectionName = "EmailVerification";

    public int CodeLength { get; set; } = 6;

    public int ExpirationMinutes { get; set; } = 15;
}
