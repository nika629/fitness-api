using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.WorkoutExercises;
using WebApplicationLB.Infrastructure.Services.WorkoutPlans;

namespace WebApplicationLB.Infrastructure.Services
{
    public class WorkoutExerciseService
    {
        private readonly ApplicationDbContext _context;

        public WorkoutExerciseService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<List<WorkoutExerciseResponseDTO>>> GetAllWorkoutExercisesByPlan(int planID, int userID)
        {
            var result = new ServiceResponse<List<WorkoutExerciseResponseDTO>>();

            var plan = await _context.WorkoutPlans.FirstOrDefaultAsync(p => p.WorkoutPlanID == planID);


            if (plan == null || plan.UserID != userID)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutExerciseService)}.{nameof(GetAllWorkoutExercisesByPlan)} - ERROR: couldn't get all workut exercise.";
            }
            else
            {
                var workoutExercises = await _context.WorkoutExercises
                .Where(we => we.WorkoutPlanID == planID)
                .Include(we => we.Exercise)
                .Select(we => new WorkoutExerciseResponseDTO
                {
                    WorkoutExerciseID = we.WorkoutExerciseID,
                    Sets = we.Sets,
                    Reps = we.Reps,
                    RestTime = we.RestTime,
                    OrderNumber = we.OrderNumber,
                    WorkoutPlanID = we.WorkoutPlanID,
                    ExerciseID = we.ExerciseID,
                    ExerciseName = we.Exercise.ExerciseName
                })
                .ToListAsync();

                result.IsSuccessful = true;
                result.Data = workoutExercises;
            }

            return result;

        }

        public async Task<ServiceResponse<WorkoutExerciseResponseDTO>> GetWorkoutExerciseByID(int userID, int workoutExerciseID)
        {
            var result = new ServiceResponse<WorkoutExerciseResponseDTO>();

            var workoutExercise = await _context.WorkoutExercises
                .Include(s => s.Exercise)
                .Include(s => s.WorkoutPlan)
                .FirstOrDefaultAsync(s => s.WorkoutExerciseID == workoutExerciseID);

            if(workoutExercise == null || workoutExercise.WorkoutPlan.UserID != userID)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutExerciseService)}.{nameof(GetWorkoutExerciseByID)} - ERROR: couldn't get workout exercise by ID.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = new WorkoutExerciseResponseDTO
                {
                    WorkoutExerciseID = workoutExercise.WorkoutExerciseID,
                    Sets = workoutExercise.Sets,
                    Reps = workoutExercise.Reps,
                    RestTime = workoutExercise.RestTime,
                    OrderNumber = workoutExercise.OrderNumber,
                    WorkoutPlanID = workoutExercise.WorkoutPlanID,
                    ExerciseID = workoutExercise.ExerciseID,
                    ExerciseName = workoutExercise.Exercise.ExerciseName
                };
            }

            return result;
        }

        public async Task<ServiceResponse<WorkoutExerciseResponseDTO>> CreateWorkoutExercise(int userID, WorkoutExerciseCreateDTO Cdto)
        {
            var result = new ServiceResponse<WorkoutExerciseResponseDTO>();

            var workoutExercise = new WorkoutExercise
            {
                Sets = Cdto.Sets,
                Reps = Cdto.Reps,
                OrderNumber = Cdto.OrderNumber,
                WorkoutPlanID = Cdto.WorkoutPlanID,
                ExerciseID = Cdto.ExerciseID,
                RestTime = Cdto.RestTime
            };

            if (workoutExercise != null)
            {
                _context.WorkoutExercises.Add(workoutExercise);
                await _context.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new WorkoutExerciseResponseDTO
                {
                    WorkoutExerciseID = workoutExercise.WorkoutExerciseID,
                    Reps = workoutExercise.Reps,
                    Sets = workoutExercise.Sets,
                    RestTime = workoutExercise.RestTime,
                    OrderNumber = workoutExercise.OrderNumber,
                    WorkoutPlanID = workoutExercise.WorkoutPlanID,
                    ExerciseID = workoutExercise.ExerciseID
                };
            }
            else
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutExerciseService)}.{nameof(CreateWorkoutExercise)} - ERROR: Couldn't create workout exercise.";
            }


            return result;
        }

        public async Task<ServiceResponse<WorkoutExerciseResponseDTO>> UpdateWorkoutExercise(int userID, int workoutExerciseID, WorkoutExerciseUpdateDTO Udto)
        {
            var result = new ServiceResponse<WorkoutExerciseResponseDTO>();

            var workoutExercise = await _context.WorkoutExercises
                .Include(ex => ex.Exercise)
                .Include(wp => wp.WorkoutPlan)
                .FirstOrDefaultAsync(i => i.WorkoutExerciseID == workoutExerciseID);

            if (workoutExercise == null || workoutExercise.WorkoutPlan.UserID != userID)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutExerciseService)}.{nameof(UpdateWorkoutExercise)} - ERROR: Couldn't update workout exercise.";
            }
            else
            {
                workoutExercise.Sets = Udto.Sets ?? workoutExercise.Sets;
                workoutExercise.Reps = Udto.Reps ?? workoutExercise.Reps;
                workoutExercise.OrderNumber = Udto.OrderNumber ?? workoutExercise.OrderNumber;
                workoutExercise.RestTime = Udto.RestTime ?? workoutExercise.RestTime;

                await _context.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new WorkoutExerciseResponseDTO
                {
                    WorkoutExerciseID = workoutExercise.WorkoutExerciseID,
                    Sets = workoutExercise.Sets,
                    Reps = workoutExercise.Reps,
                    RestTime = workoutExercise.RestTime,
                    OrderNumber = workoutExercise.OrderNumber,
                    ExerciseID = workoutExercise.ExerciseID,
                    ExerciseName = workoutExercise.Exercise.ExerciseName,
                    WorkoutPlanID = workoutExercise.WorkoutPlanID
                };
            }

            return result;
        }

        public async Task DeleteWorkoutExercise(int workoutExerciseID, int userID)
        {
            var wk = await _context.WorkoutExercises
                .Include(w => w.WorkoutPlan)   
                .FirstOrDefaultAsync(s => s.WorkoutExerciseID == workoutExerciseID);

            if (wk != null && wk.WorkoutPlan.UserID == userID)
            {
                _context.WorkoutExercises.Remove(wk);
                await _context.SaveChangesAsync();
            }
        }
    }
}
