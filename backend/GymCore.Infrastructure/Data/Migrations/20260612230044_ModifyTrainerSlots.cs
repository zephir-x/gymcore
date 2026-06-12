using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ModifyTrainerSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "TrainerSlots",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "xmin",
                table: "TrainerSlots");
        }
    }
}
