namespace LifeSyncTracker.API.Exceptions;

/// <summary>
/// Exception indicating a request should be throttled.
/// </summary>
public class TooManyRequestsException : Exception
{
    public TooManyRequestsException(string message) : base(message)
    {
    }
}
