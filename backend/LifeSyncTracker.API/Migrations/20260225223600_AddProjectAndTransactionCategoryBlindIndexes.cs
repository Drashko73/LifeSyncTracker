using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeSyncTracker.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectAndTransactionCategoryBlindIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NameHash",
                table: "TransactionCategories",
                type: "character varying(44)",
                maxLength: 44,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameHash",
                table: "Projects",
                type: "character varying(44)",
                maxLength: 44,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NameHash",
                table: "TransactionCategories");

            migrationBuilder.DropColumn(
                name: "NameHash",
                table: "Projects");
        }
    }
}
