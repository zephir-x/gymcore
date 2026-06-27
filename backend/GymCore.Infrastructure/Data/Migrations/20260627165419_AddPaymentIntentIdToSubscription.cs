using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentIntentIdToSubscription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentIntentId",
                table: "UserSubscriptions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentIntentId",
                table: "UserSubscriptions");
        }
    }
}
