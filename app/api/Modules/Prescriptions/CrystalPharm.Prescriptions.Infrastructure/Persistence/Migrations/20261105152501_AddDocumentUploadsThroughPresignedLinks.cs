using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentUploadsThroughPresignedLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "documents_confirmed_at",
                schema: "prescriptions",
                table: "submissions",
                type: "timestamp with time zone",
                nullable: true);

            // Les envois d'avant passaient leurs fichiers dans la requête : ils sont tous arrivés chez l'équipe.
            migrationBuilder.Sql("update prescriptions.submissions set documents_confirmed_at = submitted_at;");

            migrationBuilder.AddColumn<int>(
                name: "position",
                schema: "prescriptions",
                table: "documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "documents_confirmed_at",
                schema: "prescriptions",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "position",
                schema: "prescriptions",
                table: "documents");
        }
    }
}
