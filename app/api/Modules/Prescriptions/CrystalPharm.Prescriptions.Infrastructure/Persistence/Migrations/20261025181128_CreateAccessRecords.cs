using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CreateAccessRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "access_records",
                schema: "prescriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    caller_id = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    submission_ids = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    accessed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_access_records", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_access_records_tenant_id_accessed_at",
                schema: "prescriptions",
                table: "access_records",
                columns: new[] { "tenant_id", "accessed_at" });

            // La trace est en ajout seul : ni modification ni suppression, même pour son Tenant.
            migrationBuilder.Sql("""
                alter table prescriptions.access_records enable row level security;
                create policy access_records_readable_by_active_tenant on prescriptions.access_records
                    for select using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
                create policy access_records_written_by_active_tenant on prescriptions.access_records
                    for insert with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "access_records",
                schema: "prescriptions");
        }
    }
}
