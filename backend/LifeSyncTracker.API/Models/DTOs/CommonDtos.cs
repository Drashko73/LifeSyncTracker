namespace LifeSyncTracker.API.Models.DTOs;

/// <summary>
/// Generic paginated response wrapper.
/// </summary>
/// <typeparam name="T">Type of items in the response.</typeparam>
public class PaginatedResponse<T>
{
    /// <summary>
    /// List of items.
    /// </summary>
    public List<T> Items { get; set; } = new List<T>();

    /// <summary>
    /// Current page number.
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Page size.
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items.
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages.
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// Whether there is a next page.
    /// </summary>
    public bool HasNextPage => Page < TotalPages;

    /// <summary>
    /// Whether there is a previous page.
    /// </summary>
    public bool HasPreviousPage => Page > 1;
}

/// <summary>
/// Standard API response wrapper.
/// </summary>
/// <typeparam name="T">Type of data in the response.</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Whether the request was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Response data.
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Error message (if any).
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// List of validation errors (if any).
    /// </summary>
    public List<string>? Errors { get; set; }

    /// <summary>
    /// Creates a successful response.
    /// </summary>
    public static ApiResponse<T> SuccessResponse(T data, string? message = null) => new()
    {
        Success = true,
        Data = data,
        Message = message
    };

    /// <summary>
    /// Creates an error response.
    /// </summary>
    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null) => new()
    {
        Success = false,
        Message = message,
        Errors = errors
    };
}
