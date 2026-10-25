using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CreateSubmissionsAndDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "prescriptions");

            migrationBuilder.CreateTable(
                name: "submissions",
                schema: "prescriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    birth_date = table.Column<DateOnly>(type: "date", nullable: false),
                    phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    planned_visit_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    has_already_visited = table.Column<bool>(type: "boolean", nullable: false),
                    social_security_number = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_submissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "documents",
                schema: "prescriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    submission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    format = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    size_in_bytes = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_documents", x => x.id);
                    table.ForeignKey(
                        name: "fk_documents_submissions_submission_id",
                        column: x => x.submission_id,
                        principalSchema: "prescriptions",
                        principalTable: "submissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_documents_submission_id",
                schema: "prescriptions",
                table: "documents",
                column: "submission_id");

            migrationBuilder.CreateIndex(
                name: "ix_documents_tenant_id_submission_id",
                schema: "prescriptions",
                table: "documents",
                columns: new[] { "tenant_id", "submission_id" });

            migrationBuilder.CreateIndex(
                name: "ix_submissions_tenant_id_idempotency_key",
                schema: "prescriptions",
                table: "submissions",
                columns: new[] { "tenant_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_submissions_tenant_id_planned_visit_at",
                schema: "prescriptions",
                table: "submissions",
                columns: new[] { "tenant_id", "planned_visit_at" });

            // Row-Level Security, en plus du query filter : le Tenant est posé au début de
            // chaque transaction par TenantTransactionInterceptor.
            migrationBuilder.Sql("""
                alter table prescriptions.submissions enable row level security;
                create policy submissions_of_active_tenant on prescriptions.submissions
                    using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
                    with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

                alter table prescriptions.documents enable row level security;
                create policy documents_of_active_tenant on prescriptions.documents
                    using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
                    with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "documents",
                schema: "prescriptions");

            migrationBuilder.DropTable(
                name: "submissions",
                schema: "prescriptions");
        }
    }
}
