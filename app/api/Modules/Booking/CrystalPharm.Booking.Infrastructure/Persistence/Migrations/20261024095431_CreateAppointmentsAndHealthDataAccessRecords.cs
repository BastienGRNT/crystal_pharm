using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Booking.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CreateAppointmentsAndHealthDataAccessRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "booking");

            migrationBuilder.CreateTable(
                name: "appointments",
                schema: "booking",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    employee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day = table.Column<DateOnly>(type: "date", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    patient_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    patient_phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    reason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "health_data_access_records",
                schema: "booking",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    caller_id = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    appointment_ids = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    accessed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_health_data_access_records", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointments_tenant_id_day",
                schema: "booking",
                table: "appointments",
                columns: new[] { "tenant_id", "day" });

            migrationBuilder.CreateIndex(
                name: "ix_health_data_access_records_tenant_id_accessed_at",
                schema: "booking",
                table: "health_data_access_records",
                columns: new[] { "tenant_id", "accessed_at" });

            // Une double réservation est impossible, même entre deux requêtes simultanées :
            // deux rendez-vous non annulés d'un même Employee ne se chevauchent jamais.
            migrationBuilder.Sql("create extension if not exists btree_gist;");
            migrationBuilder.Sql("""
                alter table booking.appointments
                    add constraint appointments_employee_slots_do_not_overlap
                    exclude using gist (
                        tenant_id with =,
                        employee_id with =,
                        tsrange(day + start_time, day + end_time) with &&
                    ) where (status <> 'cancelled');
                """);

            // Row-Level Security, en plus du query filter : le Tenant est posé au début de
            // chaque transaction par TenantTransactionInterceptor.
            migrationBuilder.Sql("""
                alter table booking.appointments enable row level security;
                create policy appointments_of_active_tenant on booking.appointments
                    using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
                    with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

                alter table booking.health_data_access_records enable row level security;
                create policy health_data_access_records_readable_by_active_tenant on booking.health_data_access_records
                    for select using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
                create policy health_data_access_records_written_by_active_tenant on booking.health_data_access_records
                    for insert with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointments",
                schema: "booking");

            migrationBuilder.DropTable(
                name: "health_data_access_records",
                schema: "booking");
        }
    }
}
