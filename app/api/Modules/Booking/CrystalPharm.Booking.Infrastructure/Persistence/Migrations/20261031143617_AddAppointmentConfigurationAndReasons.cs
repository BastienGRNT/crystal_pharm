using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Booking.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentConfigurationAndReasons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "note",
                schema: "booking",
                table: "appointments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "reason_id",
                schema: "booking",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "appointment_configurations",
                schema: "booking",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    configuration = table.Column<string>(type: "jsonb", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointment_configurations", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_configurations_tenant_id",
                schema: "booking",
                table: "appointment_configurations",
                column: "tenant_id",
                unique: true);

            migrationBuilder.Sql("""
                alter table booking.appointment_configurations enable row level security;
                create policy appointment_configurations_of_active_tenant on booking.appointment_configurations
                    using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
                    with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointment_configurations",
                schema: "booking");

            migrationBuilder.DropColumn(
                name: "note",
                schema: "booking",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "reason_id",
                schema: "booking",
                table: "appointments");
        }
    }
}
