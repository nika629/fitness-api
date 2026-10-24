using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.FavoriteExercises;
using WebApplicationLB.Infrastructure.Services.FoodLogs;
using WebApplicationLB.Infrastructure.Services.WorkoutPlans;

namespace WebApplicationAPI.Tests
{
    public class WorkoutAndFoodTests
    {
        // Workout Plan იქმნება UTC დროით (ადრე DateTime.Now-ის გამო 500 ბრუნდებოდა)
        [Fact]
        public async Task WorkoutPlan_Create_UsesUtcDate()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com");
            var service = new WorkoutPlanService(db);

            var result = await service.CreateWorkoutPlan(user.UserID, new CreateWorkoutPlanDTO { WorkoutPlanName = "Push day" });

            Assert.True(result.IsSuccessful);
            Assert.Equal(DateTimeKind.Utc, result.Data!.CreatedAt.Kind);
        }

        // სხვისი გეგმის შეცვლა არ შეიძლება -> 404
        [Fact]
        public async Task WorkoutPlan_UpdateOtherUsersPlan_Returns404()
        {
            using var db = TestHelpers.CreateDb();
            var owner = TestHelpers.AddUser(db, "owner@test.com");
            var other = TestHelpers.AddUser(db, "other@test.com");
            var service = new WorkoutPlanService(db);
            var plan = await service.CreateWorkoutPlan(owner.UserID, new CreateWorkoutPlanDTO { WorkoutPlanName = "Mine" });

            var result = await service.UpdateWorkoutPlan(plan.Data!.WorkoutPlanID, other.UserID,
                new UpdateWorkoutPlanDTO { WorkoutPlanName = "Hacked" });

            Assert.Equal(404, result.StatusCode);
        }

        // სხვისი FoodLog-ის წაშლა არ შეიძლება -> 404
        [Fact]
        public async Task FoodLog_DeleteOtherUsersLog_Returns404()
        {
            using var db = TestHelpers.CreateDb();
            var owner = TestHelpers.AddUser(db, "owner@test.com");
            var other = TestHelpers.AddUser(db, "other@test.com");
            var service = new FoodLogService(db);
            var log = await service.CreateFoodlog(owner.UserID, new FoodLogCreateDTO { FoodName = "Rice", Calories = 200 });

            var result = await service.DeletefoodLog(log.Data!.FoodLogID, other.UserID);

            Assert.Equal(404, result.StatusCode);
        }

        // ფავორიტებში დამატება მუშაობს, მეორედ დამატება კი -> 409
        [Fact]
        public async Task Favorite_AddSameExerciseTwice_Returns409()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com");
            var exercise = TestHelpers.AddExercise(db);
            var service = new FavoriteExerciseService(db);

            var first = await service.CreateFavoriteExercise(user.UserID, new FavoriteExerciseCreateDTO { ExerciseID = exercise.ExerciseID });
            var second = await service.CreateFavoriteExercise(user.UserID, new FavoriteExerciseCreateDTO { ExerciseID = exercise.ExerciseID });

            Assert.True(first.IsSuccessful);
            Assert.Equal(409, second.StatusCode);
        }
    }
}
