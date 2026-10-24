using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.WorkoutExercises;

namespace WebApplicationLB.Infrastructure.Services
{
    public class WorkoutExerciseService
    {
        private readonly ApplicationDbContext _context;

        public WorkoutExerciseService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Workout exercises that belong to one of the user's plans
        private IQueryable<WorkoutExerciseResponseDTO> QueryForUser(int userID) =>
            _context.WorkoutExercises
                .Where(w => w.WorkoutPlan!.UserID == userID)
                .Select(w => new WorkoutExerciseResponseDTO
                {
                    WorkoutExerciseID = w.WorkoutExerciseID,
                    Sets = w.Sets,
                    Reps = w.Reps,
                    RestTime = w.RestTime,
                    OrderNumber = w.OrderNumber,
                    WorkoutPlanID = w.WorkoutPlanID,
                    ExerciseID = w.ExerciseID,
                    ExerciseName = w.Exercise!.ExerciseName
                });

        public async Task<ServiceResponse<List<WorkoutExerciseResponseDTO>>> GetAllWorkoutExercisesByPlan(int planID, int userID)
        {
            var planExists = await _context.WorkoutPlans.AnyAsync(p => p.WorkoutPlanID == planID && p.UserID == userID);
            if (!planExists)
            {
                return ServiceResponse<List<WorkoutExerciseResponseDTO>>.NotFound("Workout plan not found.");
            }

            var items = await QueryForUser(userID)
                .Where(w => w.WorkoutPlanID == planID)
                .OrderBy(w => w.OrderNumber)
                .ToListAsync();

            return ServiceResponse<List<WorkoutExerciseResponseDTO>>.Success(items);
        }

        public async Task<ServiceResponse<WorkoutExerciseResponseDTO>> GetWorkoutExerciseByID(int userID, int workoutExerciseID)
        {
            var item = await QueryForUser(userID)
                .FirstOrDefaultAsync(w => w.WorkoutExerciseID == workoutExerciseID);

            return item == null
                ? ServiceResponse<WorkoutExerciseResponseDTO>.NotFound("Workout exercise not found.")
                : ServiceResponse<WorkoutExerciseResponseDTO>.Success(item);
        }

        public async Task<ServiceResponse<WorkoutExerciseResponseDTO>> CreateWorkoutExercise(int userID, WorkoutExerciseCreateDTO dto)
        {
            var planExists = await _context.WorkoutPlans
                .AnyAsync(p => p.WorkoutPlanID == dto.WorkoutPlanID && p.UserID == userID);
            if (!planExists)
            {
                return ServiceResponse<WorkoutExerciseResponseDTO>.NotFound("Workout plan not found.");
            }

            var exerciseExists = await _context.Exercises.AnyAsync(e => e.ExerciseID == dto.ExerciseID);
            if (!exerciseExists)
            {
                return ServiceResponse<WorkoutExerciseResponseDTO>.Fail("Exercise not found.");
            }

            var workoutExercise = new WorkoutExercise
            {
                WorkoutPlanID = dto.WorkoutPlanID,
                ExerciseID = dto.ExerciseID,
                Sets = dto.Sets,
                Reps = dto.Reps,
                RestTime = dto.RestTime,
                OrderNumber = dto.OrderNumber
            };

            _context.WorkoutExercises.Add(workoutExercise);
            await _context.SaveChangesAsync();

            return await GetWorkoutExerciseByID(userID, workoutExercise.WorkoutExerciseID);
        }

        public async Task<ServiceResponse<WorkoutExerciseResponseDTO>> UpdateWorkoutExercise(int userID, int workoutExerciseID, WorkoutExerciseUpdateDTO dto)
        {
            var workoutExercise = await _context.WorkoutExercises
                .FirstOrDefaultAsync(w => w.WorkoutExerciseID == workoutExerciseID && w.WorkoutPlan!.UserID == userID);

            if (workoutExercise == null)
            {
                return ServiceResponse<WorkoutExerciseResponseDTO>.NotFound("Workout exercise not found.");
            }

            if (dto.Sets.HasValue) workoutExercise.Sets = dto.Sets.Value;
            if (dto.Reps.HasValue) workoutExercise.Reps = dto.Reps.Value;
            if (dto.RestTime.HasValue) workoutExercise.RestTime = dto.RestTime.Value;
            if (dto.OrderNumber.HasValue) workoutExercise.OrderNumber = dto.OrderNumber.Value;

            await _context.SaveChangesAsync();

            return await GetWorkoutExerciseByID(userID, workoutExerciseID);
        }

        public async Task<ServiceResponse<bool>> DeleteWorkoutExercise(int workoutExerciseID, int userID)
        {
            var workoutExercise = await _context.WorkoutExercises
                .FirstOrDefaultAsync(w => w.WorkoutExerciseID == workoutExerciseID && w.WorkoutPlan!.UserID == userID);

            if (workoutExercise == null)
            {
                return ServiceResponse<bool>.NotFound("Workout exercise not found.");
            }

            _context.WorkoutExercises.Remove(workoutExercise);
            await _context.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }
    }
}
