using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LifeSyncTracker.API.Models.Entities;

/// <summary>
/// Represents a category for transactions (e.g., "Salary", "Groceries", "Rent").
/// </summary>
public class TransactionCategory
{
    /// <summary>
    /// Unique identifier for the category.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Name of the category.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Type of transactions this category is for.
    /// </summary>
    [Required]
    public TransactionType Type { get; set; }

    /// <summary>
    /// Optional icon name for display.
    /// </summary>
    [MaxLength(50)]
    public string? Icon { get; set; }

    /// <summary>
    /// Color code for visual identification.
    /// </summary>
    [MaxLength(20)]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Whether this is a system-defined category.
    /// </summary>
    public bool IsSystem { get; set; } = false;

    /// <summary>
    /// Date and time when the category was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Foreign key to the user (null for system categories).
    /// </summary>
    public int? UserId { get; set; }

    // Navigation properties

    /// <summary>
    /// The user who created this category (null for system categories).
    /// </summary>
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    /// <summary>
    /// Transactions in this category.
    /// </summary>
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

/// <summary>
/// Enum representing the type of transaction.
/// </summary>
public enum TransactionType
{
    /// <summary>
    /// Income transaction (money coming in).
    /// </summary>
    Income = 0,

    /// <summary>
    /// Expense transaction (money going out).
    /// </summary>
    Expense = 1
}
