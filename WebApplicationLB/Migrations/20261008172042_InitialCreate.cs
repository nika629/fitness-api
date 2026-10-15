using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WebApplicationLB.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Dictionaries",
                columns: table => new
                {
                    DictionaryID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DictionaryParentID = table.Column<int>(type: "integer", nullable: true),
                    DictionaryGroupIntCode = table.Column<int>(type: "integer", nullable: true),
                    DictionaryCaption = table.Column<string>(type: "text", nullable: false),
                    DictionaryItemIntCode = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dictionaries", x => x.DictionaryID);
                    table.ForeignKey(
                        name: "FK_Dictionaries_Dictionaries_DictionaryParentID",
                        column: x => x.DictionaryParentID,
                        principalTable: "Dictionaries",
                        principalColumn: "DictionaryID");
                });

            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    ExerciseID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExerciseName = table.Column<string>(type: "text", nullable: false),
                    ExerciseDescription = table.Column<string>(type: "text", nullable: false),
                    ExerciseDifficulty = table.Column<string>(type: "text", nullable: false),
                    MuscleGroupDictionaryID = table.Column<int>(type: "integer", nullable: false),
                    EquipmentDictionaryID = table.Column<int>(type: "integer", nullable: true),
                    CreateAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.ExerciseID);
                    table.ForeignKey(
                        name: "FK_Exercises_Dictionaries_EquipmentDictionaryID",
                        column: x => x.EquipmentDictionaryID,
                        principalTable: "Dictionaries",
                        principalColumn: "DictionaryID");
                    table.ForeignKey(
                        name: "FK_Exercises_Dictionaries_MuscleGroupDictionaryID",
                        column: x => x.MuscleGroupDictionaryID,
                        principalTable: "Dictionaries",
                        principalColumn: "DictionaryID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserName = table.Column<string>(type: "text", nullable: false),
                    UserLastName = table.Column<string>(type: "text", nullable: false),
                    UserAge = table.Column<int>(type: "integer", nullable: true),
                    UserEmail = table.Column<string>(type: "text", nullable: false),
                    UserPhone = table.Column<string>(type: "text", nullable: false),
                    UserPasswordHash = table.Column<string>(type: "text", nullable: false),
                    BirthDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Height = table.Column<double>(type: "double precision", nullable: true),
                    CurrentWeight = table.Column<double>(type: "double precision", nullable: true),
                    GoalWeight = table.Column<double>(type: "double precision", nullable: true),
                    UserDictionaryRoleID = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserID);
                    table.ForeignKey(
                        name: "FK_Users_Dictionaries_UserDictionaryRoleID",
                        column: x => x.UserDictionaryRoleID,
                        principalTable: "Dictionaries",
                        principalColumn: "DictionaryID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FavortiteExercises",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    ExerciseID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavortiteExercises", x => new { x.UserID, x.ExerciseID });
                    table.ForeignKey(
                        name: "FK_FavortiteExercises_Exercises_ExerciseID",
                        column: x => x.ExerciseID,
                        principalTable: "Exercises",
                        principalColumn: "ExerciseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavortiteExercises_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FoodLogs",
                columns: table => new
                {
                    FoodLogID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FoodName = table.Column<string>(type: "text", nullable: false),
                    Calories = table.Column<int>(type: "integer", nullable: false),
                    Protein = table.Column<double>(type: "double precision", nullable: false),
                    Carbohydrates = table.Column<double>(type: "double precision", nullable: false),
                    Fat = table.Column<double>(type: "double precision", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FoodLogs", x => x.FoodLogID);
                    table.ForeignKey(
                        name: "FK_FoodLogs_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutPlans",
                columns: table => new
                {
                    WorkoutPlanID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkoutPlanName = table.Column<string>(type: "text", nullable: false),
                    WorkoutPlanDescription = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserID = table.Column<int>(type: "integer", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutPlans", x => x.WorkoutPlanID);
                    table.ForeignKey(
                        name: "FK_WorkoutPlans_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutExercises",
                columns: table => new
                {
                    WorkoutExerciseID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Sets = table.Column<int>(type: "integer", nullable: false),
                    Reps = table.Column<int>(type: "integer", nullable: false),
                    RestTime = table.Column<int>(type: "integer", nullable: false),
                    OrderNumber = table.Column<int>(type: "integer", nullable: false),
                    WorkoutPlanID = table.Column<int>(type: "integer", nullable: false),
                    ExerciseID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutExercises", x => x.WorkoutExerciseID);
                    table.ForeignKey(
                        name: "FK_WorkoutExercises_Exercises_ExerciseID",
                        column: x => x.ExerciseID,
                        principalTable: "Exercises",
                        principalColumn: "ExerciseID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkoutExercises_WorkoutPlans_WorkoutPlanID",
                        column: x => x.WorkoutPlanID,
                        principalTable: "WorkoutPlans",
                        principalColumn: "WorkoutPlanID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Dictionaries_DictionaryParentID",
                table: "Dictionaries",
                column: "DictionaryParentID");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_EquipmentDictionaryID",
                table: "Exercises",
                column: "EquipmentDictionaryID");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_MuscleGroupDictionaryID",
                table: "Exercises",
                column: "MuscleGroupDictionaryID");

            migrationBuilder.CreateIndex(
                name: "IX_FavortiteExercises_ExerciseID",
                table: "FavortiteExercises",
                column: "ExerciseID");

            migrationBuilder.CreateIndex(
                name: "IX_FoodLogs_UserID",
                table: "FoodLogs",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Users_UserDictionaryRoleID",
                table: "Users",
                column: "UserDictionaryRoleID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutExercises_ExerciseID",
                table: "WorkoutExercises",
                column: "ExerciseID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutExercises_WorkoutPlanID",
                table: "WorkoutExercises",
                column: "WorkoutPlanID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutPlans_UserID",
                table: "WorkoutPlans",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FavortiteExercises");

            migrationBuilder.DropTable(
                name: "FoodLogs");

            migrationBuilder.DropTable(
                name: "WorkoutExercises");

            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "WorkoutPlans");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Dictionaries");
        }
    }
}
