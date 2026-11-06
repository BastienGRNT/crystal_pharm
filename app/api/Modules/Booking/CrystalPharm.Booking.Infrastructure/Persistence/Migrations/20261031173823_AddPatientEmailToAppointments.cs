using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Booking.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientEmailToAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "patient_email",
                schema: "booking",
                table: "appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "patient_email",
                schema: "booking",
                table: "appointments");
        }
    }
}
