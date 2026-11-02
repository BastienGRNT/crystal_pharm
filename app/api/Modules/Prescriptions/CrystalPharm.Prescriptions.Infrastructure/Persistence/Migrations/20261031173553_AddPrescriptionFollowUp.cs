using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPrescriptionFollowUp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "planned_visit_at",
                schema: "prescriptions",
                table: "submissions",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AddColumn<string>(
                name: "email",
                schema: "prescriptions",
                table: "submissions",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "expected_products_on",
                schema: "prescriptions",
                table: "submissions",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_renewal",
                schema: "prescriptions",
                table: "submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "note_from_patient",
                schema: "prescriptions",
                table: "submissions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                schema: "prescriptions",
                table: "submissions",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Received");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "status_changed_at",
                schema: "prescriptions",
                table: "submissions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            // Les envois déjà reçus n'ont pas d'historique : leur statut date de leur arrivée.
            migrationBuilder.Sql("UPDATE prescriptions.submissions SET status_changed_at = submitted_at;");

            migrationBuilder.AddColumn<string>(
                name: "team_note",
                schema: "prescriptions",
                table: "submissions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_submissions_tenant_id_status_status_changed_at",
                schema: "prescriptions",
                table: "submissions",
                columns: new[] { "tenant_id", "status", "status_changed_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_submissions_tenant_id_status_status_changed_at",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "email",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "expected_products_on",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "is_renewal",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "note_from_patient",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "status_changed_at",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "team_note",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.AlterColumn<DateTime>(
                name: "planned_visit_at",
                schema: "prescriptions",
                table: "submissions",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);
        }
    }
}
