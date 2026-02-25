using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Models.Entities;
using LifeSyncTracker.API.Services;

namespace LifeSyncTracker.API.Data;

/// <summary>
/// Database context for LifeSync Tracker application.
/// Supports SQLite for development and PostgreSQL for production.
/// </summary>
public class ApplicationDbContext : DbContext
{
    private readonly AesEncryptionService _encryptionService;

    /// <summary>
    /// Initializes a new instance of the ApplicationDbContext.
    /// </summary>
    /// <param name="options">Database context options.</param>
    /// <param name="encryptionService">AES encryption service for encrypting sensitive data.</param>
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        AesEncryptionService encryptionService) : base(options)
    {
        _encryptionService = encryptionService;
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

            entity.Property(u => u.Username).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));

            entity.Property(u => u.Email).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasOne(p => p.User)
                  .WithMany(u => u.Projects)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(p => p.Name).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));

            entity.Property(p => p.Description).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));

            entity.Property(p => p.HourlyRate)
                .HasColumnType("text")
                .HasConversion(
                    v => v.HasValue ? _encryptionService.Encrypt(v.Value.ToString("F2")) : null,
                    v => v == null ? (decimal?)null : decimal.Parse(_encryptionService.Decrypt(v)));
        });

        // Tag configuration
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasOne(t => t.User)
                  .WithMany(u => u.Tags)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(t => new { t.UserId, t.Name }).IsUnique();

            entity.Property(t => t.Name).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));
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

            entity.Property(te => te.Description).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));
            entity.Property(te => te.NextSteps).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));
        });

        // TransactionCategory configuration
        modelBuilder.Entity<TransactionCategory>(entity =>
        {
            entity.HasOne(tc => tc.User)
                  .WithMany(u => u.TransactionCategories)
                  .HasForeignKey(tc => tc.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(tc => tc.Name).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));
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

            entity.Property(t => t.Amount)
                .HasColumnType("text")
                .HasConversion(
                    v => _encryptionService.Encrypt(v.ToString("F2")),
                    v => decimal.Parse(_encryptionService.Decrypt(v)));

            entity.Property(t => t.Description).HasConversion(
                v => v == null ? null : _encryptionService.Encrypt(v),
                v => v == null ? string.Empty : _encryptionService.Decrypt(v));
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
    }
}
