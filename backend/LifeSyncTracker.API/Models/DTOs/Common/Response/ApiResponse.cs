namespace LifeSyncTracker.API.Models.DTOs.Common.Response
{
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
}
