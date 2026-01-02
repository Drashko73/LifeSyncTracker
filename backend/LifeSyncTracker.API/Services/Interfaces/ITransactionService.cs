using LifeSyncTracker.API.Models.DTOs;

namespace LifeSyncTracker.API.Services.Interfaces;

/// <summary>
/// Service for transaction management operations.
/// </summary>
public interface ITransactionService
{
    /// <summary>
    /// Gets all transaction categories available to a user.
    /// </summary>
    /// <param name="userId">User ID (for user-specific categories).</param>
    /// <returns>List of categories.</returns>
    Task<List<TransactionCategoryDto>> GetCategoriesAsync(int userId);

    /// <summary>
    /// Creates a custom transaction category.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Category data.</param>
    /// <returns>Created category.</returns>
    Task<TransactionCategoryDto> CreateCategoryAsync(int userId, CreateTransactionCategoryDto dto);

    /// <summary>
    /// Updates a custom transaction category.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="categoryId">Category ID.</param>
    /// <param name="dto">Updated category data.</param>
    /// <returns>Updated category.</returns>
    Task<TransactionCategoryDto?> UpdateCategoryAsync(int userId, int categoryId, UpdateTransactionCategoryDto dto);

    /// <summary>
    /// Deletes a custom transaction category.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="categoryId">Category ID.</param>
    /// <returns>True if deleted successfully.</returns>
    Task<bool> DeleteCategoryAsync(int userId, int categoryId);

    /// <summary>
    /// Gets transactions with filtering and pagination.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="filter">Filter criteria.</param>
    /// <returns>Paginated list of transactions.</returns>
    Task<PaginatedResponse<TransactionDto>> GetTransactionsAsync(int userId, TransactionFilterDto filter);

    /// <summary>
    /// Gets a transaction by ID.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="transactionId">Transaction ID.</param>
    /// <returns>Transaction information.</returns>
    Task<TransactionDto?> GetTransactionByIdAsync(int userId, int transactionId);

    /// <summary>
    /// Creates a new transaction.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="dto">Transaction data.</param>
    /// <returns>Created transaction.</returns>
    Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto);

    /// <summary>
    /// Updates a transaction.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="transactionId">Transaction ID.</param>
    /// <param name="dto">Updated transaction data.</param>
    /// <returns>Updated transaction.</returns>
    Task<TransactionDto?> UpdateTransactionAsync(int userId, int transactionId, UpdateTransactionDto dto);

    /// <summary>
    /// Deletes a transaction.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="transactionId">Transaction ID.</param>
    /// <returns>True if deleted successfully.</returns>
    Task<bool> DeleteTransactionAsync(int userId, int transactionId);

    /// <summary>
    /// Gets financial summary for a period.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="startDate">Period start date.</param>
    /// <param name="endDate">Period end date.</param>
    /// <returns>Financial summary.</returns>
    Task<FinancialSummaryDto> GetSummaryAsync(int userId, DateTime startDate, DateTime endDate);
}
