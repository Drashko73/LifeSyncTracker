namespace LifeSyncTracker.API.Models.DTOs.Common.Response
{
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
}
