using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Models.Entities;

namespace LifeSyncTracker.API.Data;

/// <summary>
/// Database context for LifeSync Tracker application.
/// Supports SQLite for development and PostgreSQL for production.
/// </summary>
public class ApplicationDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the ApplicationDbContext.
    /// </summary>
    /// <param name="options">Database context options.</param>
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Users table.
    /// </summary>
    public DbSet<User> Users { get; set; }

    /// <summary>
    /// Projects table.
    /// </summary>
    public DbSet<Project> Projects { get; set; }

    /// <summary>
    /// Tags table.
    /// </summary>
    public DbSet<Tag> Tags { get; set; }

    /// <summary>
    /// Time entries table.
    /// </summary>
    public DbSet<TimeEntry> TimeEntries { get; set; }

    /// <summary>
    /// Transaction categories table.
    /// </summary>
    public DbSet<TransactionCategory> TransactionCategories { get; set; }

    /// <summary>
    /// Transactions table.
    /// </summary>
    public DbSet<Transaction> Transactions { get; set; }

    /// <summary>
    /// Refresh tokens table.
    /// </summary>
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    /// <summary>
    /// Configures the model and relationships.
    /// </summary>
    /// <param name="modelBuilder">The model builder.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasOne(p => p.User)
                  .WithMany(u => u.Projects)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Tag configuration
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasOne(t => t.User)
                  .WithMany(u => u.Tags)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(t => new { t.UserId, t.Name }).IsUnique();
        });

        // TimeEntry configuration
        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.HasOne(te => te.Project)
                  .WithMany(p => p.TimeEntries)
                  .HasForeignKey(te => te.ProjectId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(te => te.User)
                  .WithMany(u => u.TimeEntries)
                  .HasForeignKey(te => te.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(te => te.Tags)
                  .WithMany(t => t.TimeEntries)
                  .UsingEntity<Dictionary<string, object>>(
                      "TimeEntryTag",
                      j => j.HasOne<Tag>().WithMany().HasForeignKey("TagId"),
                      j => j.HasOne<TimeEntry>().WithMany().HasForeignKey("TimeEntryId"));

            entity.HasIndex(te => te.StartTime);
            entity.HasIndex(te => new { te.UserId, te.IsRunning });
        });

        // TransactionCategory configuration
        modelBuilder.Entity<TransactionCategory>(entity =>
        {
            entity.HasOne(tc => tc.User)
                  .WithMany(u => u.TransactionCategories)
                  .HasForeignKey(tc => tc.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Transaction configuration
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasOne(t => t.Category)
                  .WithMany(c => c.Transactions)
                  .HasForeignKey(t => t.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.User)
                  .WithMany(u => u.Transactions)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.LinkedTimeEntry)
                  .WithOne(te => te.LinkedTransaction)
                  .HasForeignKey<Transaction>(t => t.LinkedTimeEntryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(t => t.Date);
            entity.HasIndex(t => new { t.UserId, t.Date });
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => new { rt.UserId, rt.DeviceIdentifier });

            entity.HasOne(rt => rt.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(rt => rt.Token).IsUnique();
        });

        // Seed default transaction categories
        SeedDefaultCategories(modelBuilder);
    }

    /// <summary>
    /// Seeds default transaction categories.
    /// </summary>
    /// <param name="modelBuilder">The model builder.</param>
    private static void SeedDefaultCategories(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TransactionCategory>().HasData(
            // Income categories
            new TransactionCategory { Id = 1, Name = "Salary", Type = TransactionType.Income, Icon = "pi-dollar", ColorCode = "#22C55E", IsSystem = true },
            new TransactionCategory { Id = 2, Name = "Freelance", Type = TransactionType.Income, Icon = "pi-briefcase", ColorCode = "#3B82F6", IsSystem = true },
            new TransactionCategory { Id = 3, Name = "Investment", Type = TransactionType.Income, Icon = "pi-chart-line", ColorCode = "#8B5CF6", IsSystem = true },
            new TransactionCategory { Id = 4, Name = "Other Income", Type = TransactionType.Income, Icon = "pi-plus", ColorCode = "#10B981", IsSystem = true },

            // Expense categories
            new TransactionCategory { Id = 5, Name = "Groceries", Type = TransactionType.Expense, Icon = "pi-shopping-cart", ColorCode = "#F59E0B", IsSystem = true },
            new TransactionCategory { Id = 6, Name = "Rent", Type = TransactionType.Expense, Icon = "pi-home", ColorCode = "#EF4444", IsSystem = true },
            new TransactionCategory { Id = 7, Name = "Utilities", Type = TransactionType.Expense, Icon = "pi-bolt", ColorCode = "#F97316", IsSystem = true },
            new TransactionCategory { Id = 8, Name = "Transportation", Type = TransactionType.Expense, Icon = "pi-car", ColorCode = "#6366F1", IsSystem = true },
            new TransactionCategory { Id = 9, Name = "Software Subscription", Type = TransactionType.Expense, Icon = "pi-desktop", ColorCode = "#EC4899", IsSystem = true },
            new TransactionCategory { Id = 10, Name = "Entertainment", Type = TransactionType.Expense, Icon = "pi-ticket", ColorCode = "#14B8A6", IsSystem = true },
            new TransactionCategory { Id = 11, Name = "Healthcare", Type = TransactionType.Expense, Icon = "pi-heart", ColorCode = "#F43F5E", IsSystem = true },
            new TransactionCategory { Id = 12, Name = "Other Expense", Type = TransactionType.Expense, Icon = "pi-minus", ColorCode = "#64748B", IsSystem = true }
        );
    }
}
