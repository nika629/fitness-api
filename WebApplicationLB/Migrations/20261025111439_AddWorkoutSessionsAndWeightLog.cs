using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WebApplicationLB.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutSessionsAndWeightLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeightLogs",
                columns: table => new
                {
                    WeightLogID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<double>(type: "double precision", nullable: false),
                    LoggedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeightLogs", x => x.WeightLogID);
                    table.ForeignKey(
                        name: "FK_WeightLogs_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutSessions",
                columns: table => new
                {
                    WorkoutSessionID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    WorkoutPlanID = table.Column<int>(type: "integer", nullable: true),
                    PlanName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutSessions", x => x.WorkoutSessionID);
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_WorkoutPlans_WorkoutPlanID",
                        column: x => x.WorkoutPlanID,
                        principalTable: "WorkoutPlans",
                        principalColumn: "WorkoutPlanID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutSessionSets",
                columns: table => new
                {
                    WorkoutSessionSetID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkoutSessionID = table.Column<int>(type: "integer", nullable: false),
                    ExerciseID = table.Column<int>(type: "integer", nullable: false),
                    SetNumber = table.Column<int>(type: "integer", nullable: false),
                    Reps = table.Column<int>(type: "integer", nullable: false),
                    WeightKg = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutSessionSets", x => x.WorkoutSessionSetID);
                    table.ForeignKey(
                        name: "FK_WorkoutSessionSets_Exercises_ExerciseID",
                        column: x => x.ExerciseID,
                        principalTable: "Exercises",
                        principalColumn: "ExerciseID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkoutSessionSets_WorkoutSessions_WorkoutSessionID",
                        column: x => x.WorkoutSessionID,
                        principalTable: "WorkoutSessions",
                        principalColumn: "WorkoutSessionID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeightLogs_UserID_LoggedAt",
                table: "WeightLogs",
                columns: new[] { "UserID", "LoggedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_UserID_StartedAt",
                table: "WorkoutSessions",
                columns: new[] { "UserID", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_WorkoutPlanID",
                table: "WorkoutSessions",
                column: "WorkoutPlanID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessionSets_ExerciseID",
                table: "WorkoutSessionSets",
                column: "ExerciseID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessionSets_WorkoutSessionID",
                table: "WorkoutSessionSets",
                column: "WorkoutSessionID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeightLogs");

            migrationBuilder.DropTable(
                name: "WorkoutSessionSets");

            migrationBuilder.DropTable(
                name: "WorkoutSessions");
        }
    }
}
