using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureShadowXmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "GroupClasses");

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "GroupClasses",
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
                table: "GroupClasses");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "GroupClasses",
                type: "bytea",
                rowVersion: true,
                nullable: true);
        }
    }
}
