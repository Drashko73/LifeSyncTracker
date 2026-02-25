using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeSyncTracker.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEncryptionColumnTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Amount",
                table: "Transactions",
                type: "text",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "HourlyRate",
                table: "Projects",
                type: "text",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8965), "O2loN4FxzUu3vTHCL2gzyNGr/KoFbIP2OOKKFuXcp8nTaw==" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8969), "ux7l5lvpDm8RXPdRjyJAkFwBohPepnSHtBSEJAX9zb3XoLQWqg==" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8971), "tDy7WkdHtTO1q+EeA6xza/erPvfl5MVSZjlGzAtzi39X0V4t6Cc=" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8972), "ySa9plO0F7FhC1WppIo/EcveOX71/IX1wAqXrHGE3S5ZpvT63K9OoQ==" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8973), "cy53ncN3NjKWteU+lv5Ra9MB3lUVo6McXYlSrs/AOBVpNbm69w==" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8974), "dwB7PlMkNZ3Af6E9R/BBpBGHm2bI2ZctfIcBigKrqT4=" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8975), "DyVtFMYa+734beCRtFC0/YzhpziWTl55Mh2Ot/p0tl0r0n2x9g==" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8976), "FwfsetBy6ddjxUuXnGtRY4CH0x2b31mkcWJMND/vmAtfg8VwMmWwVPwA" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8977), "hDE5Sblhxqi/HK8QTDOPCU8SKuhTgpigERwupFdmtYIccfiXSLouMwX6/Qkqv4CQmg==" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8978), "LUfbidKz81pMg02oUj4xixcTVdhIlDASNx1nikXE7OKbzUcnx9cnS5M=" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8980), "xK1GoL+JgPWcEK/a2lWDrwfK3pxT/2aR1iP+DJYDbdRFcWFHDvQ=" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 25, 13, 8, 51, 81, DateTimeKind.Utc).AddTicks(8981), "2aiP4AgmleRUx1oD79lvh6k7s/+EgXxPaQYjQtUnMNqzJQUn9m98J24=" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Transactions",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<decimal>(
                name: "HourlyRate",
                table: "Projects",
                type: "numeric(18,2)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7515), "Salary" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7522), "Freelance" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7524), "Investment" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7526), "Other Income" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7527), "Groceries" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7529), "Rent" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7531), "Utilities" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7533), "Transportation" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7534), "Software Subscription" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7536), "Entertainment" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7538), "Healthcare" });

            migrationBuilder.UpdateData(
                table: "TransactionCategories",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "CreatedAt", "Name" },
                values: new object[] { new DateTime(2026, 2, 20, 13, 34, 55, 250, DateTimeKind.Utc).AddTicks(7539), "Other Expense" });
        }
    }
}
