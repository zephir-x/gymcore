using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDiscountPercentage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscountPercentage",
                table: "SubscriptionTiers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercentage",
                table: "SubscriptionTiers",
                type: "numeric(5,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
