using Microsoft.EntityFrameworkCore;
using LifeSyncTracker.API.Models.Entities;

namespace LifeSyncTracker.API.Data;

/// <summary>
/// Seeds default data at application startup.
/// This approach is required because <see cref="TransactionCategory.Name"/> is encrypted
/// via a value converter, and <c>HasData()</c> bakes ciphertext into migrations at generation
/// time. AES-GCM uses a random nonce, making the seed non-deterministic and tied to the
/// key that was present when the migration was created. Seeding at runtime ensures the
/// current encryption key is always used.
/// </summary>
public static class DatabaseSeeder
{
    /// <summary>
    /// Ensures default system transaction categories exist in the database.
    /// Existing rows are replaced so that names are always encrypted with the current key.
    /// </summary>
    public static async Task SeedDefaultCategoriesAsync(ApplicationDbContext context, AesEncryptionService encryptionService)
    {
        var systemCategories = GetDefaultCategories(encryptionService);

        foreach (var seed in systemCategories)
        {
            var existing = await context.TransactionCategories
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == seed.Id);

            if (existing is null)
            {
                context.TransactionCategories.Add(seed);
            }
            else
            {
                // Re-encrypt the name with the current key in case it was
                // written by a migration that used a different key/nonce.
                existing.Name = seed.Name;
                existing.Type = seed.Type;
                existing.Icon = seed.Icon;
                existing.ColorCode = seed.ColorCode;
                existing.IsSystem = true;
            }
        }

        await context.SaveChangesAsync();
    }

    private static List<TransactionCategory> GetDefaultCategories(AesEncryptionService encryptionService)
    {
        return
        [
            // Income categories
            new() { Id = 1, Name = "Salary", NameHash = encryptionService.ComputeBlindIndex("Salary"), Type = TransactionType.Income, Icon = "pi-dollar", ColorCode = "#22C55E", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Name = "Freelance", NameHash = encryptionService.ComputeBlindIndex("Freelance"), Type = TransactionType.Income, Icon = "pi-briefcase", ColorCode = "#3B82F6", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 3, Name = "Investment", NameHash = encryptionService.ComputeBlindIndex("Investment"), Type = TransactionType.Income, Icon = "pi-chart-line", ColorCode = "#8B5CF6", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 4, Name = "Other Income", NameHash = encryptionService.ComputeBlindIndex("Other Income"), Type = TransactionType.Income, Icon = "pi-plus", ColorCode = "#10B981", IsSystem = true, CreatedAt = DateTime.UtcNow },

            // Expense categories
            new() { Id = 5, Name = "Groceries", NameHash = encryptionService.ComputeBlindIndex("Groceries"), Type = TransactionType.Expense, Icon = "pi-shopping-cart", ColorCode = "#F59E0B", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 6, Name = "Rent", NameHash = encryptionService.ComputeBlindIndex("Rent"), Type = TransactionType.Expense, Icon = "pi-home", ColorCode = "#EF4444", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 7, Name = "Utilities", NameHash = encryptionService.ComputeBlindIndex("Utilities"), Type = TransactionType.Expense, Icon = "pi-bolt", ColorCode = "#F97316", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 8, Name = "Transportation", NameHash = encryptionService.ComputeBlindIndex("Transportation"), Type = TransactionType.Expense, Icon = "pi-car", ColorCode = "#6366F1", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 9, Name = "Software Subscription", NameHash = encryptionService.ComputeBlindIndex("Software Subscription"), Type = TransactionType.Expense, Icon = "pi-desktop", ColorCode = "#EC4899", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 10, Name = "Entertainment", NameHash = encryptionService.ComputeBlindIndex("Entertainment"), Type = TransactionType.Expense, Icon = "pi-ticket", ColorCode = "#14B8A6", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 11, Name = "Healthcare", NameHash = encryptionService.ComputeBlindIndex("Healthcare"), Type = TransactionType.Expense, Icon = "pi-heart", ColorCode = "#F43F5E", IsSystem = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 12, Name = "Other Expense", NameHash = encryptionService.ComputeBlindIndex("Other Expense"), Type = TransactionType.Expense, Icon = "pi-minus", ColorCode = "#64748B", IsSystem = true, CreatedAt = DateTime.UtcNow },
        ];
    }
}