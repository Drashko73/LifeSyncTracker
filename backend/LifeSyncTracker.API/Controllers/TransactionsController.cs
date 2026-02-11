using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeSyncTracker.API.Models.DTOs;
using LifeSyncTracker.API.Services.Interfaces;
using LifeSyncTracker.API.Models.DTOs.Common.Response;

namespace LifeSyncTracker.API.Controllers;

/// <summary>
/// Controller for financial transaction operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    /// <summary>
    /// Initializes a new instance of the TransactionsController.
    /// </summary>
    /// <param name="transactionService">Transaction service.</param>
    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    #region Categories

    /// <summary>
    /// Gets all transaction categories.
    /// </summary>
    /// <returns>List of categories.</returns>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(ApiResponse<List<TransactionCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<TransactionCategoryDto>>>> GetCategories()
    {
        var userId = GetUserId();
        var categories = await _transactionService.GetCategoriesAsync(userId);
        return Ok(ApiResponse<List<TransactionCategoryDto>>.SuccessResponse(categories));
    }

    /// <summary>
    /// Creates a custom transaction category.
    /// </summary>
    /// <param name="dto">Category data.</param>
    /// <returns>Created category.</returns>
    [HttpPost("categories")]
    [ProducesResponseType(typeof(ApiResponse<TransactionCategoryDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<TransactionCategoryDto>>> CreateCategory([FromBody] CreateTransactionCategoryDto dto)
    {
        var userId = GetUserId();
        var category = await _transactionService.CreateCategoryAsync(userId, dto);
        if (category == null)
        {
            return BadRequest(ApiResponse<TransactionCategoryDto>.ErrorResponse("Failed to create category. Category with name {" + dto.Name + "} already exists."));
        }
        return CreatedAtAction(nameof(GetCategories), ApiResponse<TransactionCategoryDto>.SuccessResponse(category, "Category created successfully."));
    }

    /// <summary>
    /// Updates a custom transaction category.
    /// </summary>
    /// <param name="id">Category ID.</param>
    /// <param name="dto">Updated category data.</param>
    /// <returns>Updated category.</returns>
    [HttpPut("categories/{id}")]
    [ProducesResponseType(typeof(ApiResponse<TransactionCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TransactionCategoryDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TransactionCategoryDto>>> UpdateCategory(int id, [FromBody] UpdateTransactionCategoryDto dto)
    {
        var userId = GetUserId();
        var category = await _transactionService.UpdateCategoryAsync(userId, id, dto);

        if (category == null)
        {
            return NotFound(ApiResponse<TransactionCategoryDto>.ErrorResponse("Category not found or is a system category."));
        }

        return Ok(ApiResponse<TransactionCategoryDto>.SuccessResponse(category, "Category updated successfully."));
    }

    /// <summary>
    /// Deletes a custom transaction category.
    /// </summary>
    /// <param name="id">Category ID.</param>
    /// <returns>Success status.</returns>
    [HttpDelete("categories/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCategory(int id)
    {
        try
        {
            var userId = GetUserId();
            var deleted = await _transactionService.DeleteCategoryAsync(userId, id);

            if (!deleted)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Category not found or is a system category."));
            }

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Category deleted successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    #endregion

    #region Transactions

    /// <summary>
    /// Gets transactions with filtering and pagination.
    /// </summary>
    /// <param name="filter">Filter criteria.</param>
    /// <returns>Paginated list of transactions.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<TransactionDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<TransactionDto>>>> GetAll([FromQuery] TransactionFilterDto filter)
    {
        var userId = GetUserId();
        var transactions = await _transactionService.GetTransactionsAsync(userId, filter);
        return Ok(ApiResponse<PaginatedResponse<TransactionDto>>.SuccessResponse(transactions));
    }

    /// <summary>
    /// Gets a transaction by ID.
    /// </summary>
    /// <param name="id">Transaction ID.</param>
    /// <returns>Transaction information.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> GetById(int id)
    {
        var userId = GetUserId();
        var transaction = await _transactionService.GetTransactionByIdAsync(userId, id);

        if (transaction == null)
        {
            return NotFound(ApiResponse<TransactionDto>.ErrorResponse("Transaction not found."));
        }

        return Ok(ApiResponse<TransactionDto>.SuccessResponse(transaction));
    }

    /// <summary>
    /// Creates a new transaction.
    /// </summary>
    /// <param name="dto">Transaction data.</param>
    /// <returns>Created transaction.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> Create([FromBody] CreateTransactionDto dto)
    {
        try
        {
            var userId = GetUserId();
            var transaction = await _transactionService.CreateTransactionAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, ApiResponse<TransactionDto>.SuccessResponse(transaction, "Transaction created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransactionDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Updates a transaction.
    /// </summary>
    /// <param name="id">Transaction ID.</param>
    /// <param name="dto">Updated transaction data.</param>
    /// <returns>Updated transaction.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TransactionDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> Update(int id, [FromBody] UpdateTransactionDto dto)
    {
        try
        {
            var userId = GetUserId();
            var transaction = await _transactionService.UpdateTransactionAsync(userId, id, dto);

            if (transaction == null)
            {
                return NotFound(ApiResponse<TransactionDto>.ErrorResponse("Transaction not found."));
            }

            return Ok(ApiResponse<TransactionDto>.SuccessResponse(transaction, "Transaction updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransactionDto>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Deletes a transaction.
    /// </summary>
    /// <param name="id">Transaction ID.</param>
    /// <returns>Success status.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetUserId();
        var deleted = await _transactionService.DeleteTransactionAsync(userId, id);

        if (!deleted)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Transaction not found."));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, "Transaction deleted successfully."));
    }

    /// <summary>
    /// Gets financial summary for a period.
    /// </summary>
    /// <param name="startDate">Period start date.</param>
    /// <param name="endDate">Period end date.</param>
    /// <returns>Financial summary.</returns>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<FinancialSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<FinancialSummaryDto>>> GetSummary([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var userId = GetUserId();
        var summary = await _transactionService.GetSummaryAsync(userId, startDate, endDate);
        return Ok(ApiResponse<FinancialSummaryDto>.SuccessResponse(summary));
    }

    #endregion

    /// <summary>
    /// Gets the user ID from the JWT token claims.
    /// </summary>
    /// <returns>User ID.</returns>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
}
