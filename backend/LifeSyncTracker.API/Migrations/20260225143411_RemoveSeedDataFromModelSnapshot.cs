using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LifeSyncTracker.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedDataFromModelSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 12);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "TransactionCategories",
                columns: new[] { "Id", "ColorCode", "CreatedAt", "Icon", "IsSystem", "Name", "Type", "UserId" },
                values: new object[,]
                {
                    { 1, "#22C55E", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8965), "pi-dollar", true, "yWB0vP8kh1d0rJqXcpsaf5gJBvQ7InRwVYV+NalvUWQi3A==", 0, null },
                    { 2, "#3B82F6", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8969), "pi-briefcase", true, "465RG1bDbuK8iIqtxDXG1GKv2v9+mh+AxqxB/iwaLVC490KMQA==", 0, null },
                    { 3, "#8B5CF6", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8971), "pi-chart-line", true, "dQF4cnhqM3L0z/dRWAepAd2T0pMzGsyep3JQ3VjAXisDxiAib4o=", 0, null },
                    { 4, "#10B981", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8972), "pi-plus", true, "a8nPBe8TI0BwVVNo0UBHMnzBAZ5F1peDNmeL0xkax5TicCz/kNQIsA==", 0, null },
                    { 5, "#F59E0B", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8973), "pi-shopping-cart", true, "bgVRZ8X5ftskdRb9rMqp2ujoUp4E/sC04ny41CoT9P6X/0Q+Uw==", 1, null },
                    { 6, "#EF4444", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8974), "pi-home", true, "oMs+DOQOAJO8O+8UjXd1UsQcl/FrceMbo1xCgFKbZaI=", 1, null },
                    { 7, "#F97316", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8975), "pi-bolt", true, "9zlkQ5bUPTe5JC1K244VNe9FVu4t/5Wio6gywaD5d1tcfndAhg==", 1, null },
                    { 8, "#6366F1", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8976), "pi-car", true, "Ah8WMj4tNNe7zMIDmPdIadugoYESDuxHHzgv9jmkZlR/Yu8Pu3wIOsBc", 1, null },
                    { 9, "#EC4899", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8977), "pi-desktop", true, "eIYZQoghX/FSj7Ka9hEX8J4h7+uZfN17cn9f33cnLLkWmB8uTUO0AHM4NjCK2RYW6w==", 1, null },
                    { 10, "#14B8A6", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8978), "pi-ticket", true, "kNVnjsa64kJ45AP/YOAnWcVjk5FiYCqsRaxjsg93mGc0Wt1POjZLLOI=", 1, null },
                    { 11, "#F43F5E", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8980), "pi-heart", true, "3Lr8+9PogYuJRRiOCpO7OC77qov9t8NmQ++NmYSS8deQjO8MVT0=", 1, null },
                    { 12, "#64748B", new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8981), "pi-minus", true, "QrcePszRE7o6BTW6FB7BrXSfScMmUI4lm6dixd1nrkHxEjhvlCnTBx4=", 1, null }
                });
        }
    }
}
