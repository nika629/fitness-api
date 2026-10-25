using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Users;
using WebApplicationLB.Infrastructure.Services.WorkoutPlans;
using WebApplicationLB.Infrastructure.Services.WorkoutSessions;

namespace WebApplicationAPI.Tests
{
    public class WorkoutSessionTests
    {
        // ვარჯიში ინახება სეტებით, სერვერი სწორად ითვლის ხანგრძლივობას და მოცულობას
        [Fact]
        public async Task CreateSession_SavesSetsAndCalculatesTotals()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com");
            var exercise = TestHelpers.AddExercise(db);
            var service = new WorkoutSessionService(db);
            var start = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);

            var result = await service.CreateSession(user.UserID, new WorkoutSessionCreateDTO
            {
                StartedAt = start,
                FinishedAt = start.AddMinutes(45),
                Sets =
                [
                    new WorkoutSessionSetDTO { ExerciseID = exercise.ExerciseID, SetNumber = 1, Reps = 8, WeightKg = 60 },
                    new WorkoutSessionSetDTO { ExerciseID = exercise.ExerciseID, SetNumber = 2, Reps = 7, WeightKg = 60 }
                ]
            });

            Assert.True(result.IsSuccessful);
            Assert.Equal(45, result.Data!.DurationMinutes);
            Assert.Equal(2, result.Data.TotalSets);
            Assert.Equal(15, result.Data.TotalReps);
            Assert.Equal(900, result.Data.TotalVolumeKg);        // 8x60 + 7x60
            Assert.Equal("Bench Press", result.Data.Sets[0].ExerciseName);
        }

        // სხვისი გეგმით ვარჯიშის შენახვა არ შეიძლება -> 404
        [Fact]
        public async Task CreateSession_WithOtherUsersPlan_Returns404()
        {
            using var db = TestHelpers.CreateDb();
            var owner = TestHelpers.AddUser(db, "owner@test.com");
            var other = TestHelpers.AddUser(db, "other@test.com");
            var exercise = TestHelpers.AddExercise(db);
            var plan = await new WorkoutPlanService(db)
                .CreateWorkoutPlan(owner.UserID, new CreateWorkoutPlanDTO { WorkoutPlanName = "Push day" });
            var service = new WorkoutSessionService(db);
            var start = DateTime.UtcNow.AddHours(-1);

            var result = await service.CreateSession(other.UserID, new WorkoutSessionCreateDTO
            {
                WorkoutPlanID = plan.Data!.WorkoutPlanID,
                StartedAt = start,
                FinishedAt = start.AddMinutes(30),
                Sets = [new WorkoutSessionSetDTO { ExerciseID = exercise.ExerciseID, SetNumber = 1, Reps = 10 }]
            });

            Assert.Equal(404, result.StatusCode);
        }

        // პროფილში წონის შეცვლა წონის ისტორიაშიც (WeightLogs) წერს ჩანაწერს
        [Fact]
        public async Task UpdateUser_NewWeight_AddsWeightLog()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com");
            var userService = new UserService(db);

            await userService.UpdateUser(user.UserID, new UserUpdateDTO { CurrentWeight = 84.5 });
            var history = await new WeightLogService(db).GetWeightLogs(user.UserID);

            Assert.Single(history.Data!);
            Assert.Equal(84.5, history.Data![0].Weight);
        }
    }
}
