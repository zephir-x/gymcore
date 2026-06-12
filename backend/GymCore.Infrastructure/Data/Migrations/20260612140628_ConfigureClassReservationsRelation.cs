using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureClassReservationsRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassReservations_GroupClasses_GroupClassId",
                table: "ClassReservations");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassReservations_GroupClasses_GroupClassId",
                table: "ClassReservations",
                column: "GroupClassId",
                principalTable: "GroupClasses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassReservations_GroupClasses_GroupClassId",
                table: "ClassReservations");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassReservations_GroupClasses_GroupClassId",
                table: "ClassReservations",
                column: "GroupClassId",
                principalTable: "GroupClasses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
