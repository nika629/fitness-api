using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.WorkoutPlans;

namespace WebApplicationLB.Infrastructure.Services
{
    public class WorkoutPlanService
    {
        private readonly ApplicationDbContext _context;

        public WorkoutPlanService(ApplicationDbContext context)
        {
            _context = context;
        }

        private IQueryable<WorkoutPlanResposneDTO> QueryForUser(int userID) =>
            _context.WorkoutPlans
                .Where(p => p.UserID == userID)
                .Select(p => new WorkoutPlanResposneDTO
                {
                    WorkoutPlanID = p.WorkoutPlanID,
                    WorkoutPlanName = p.WorkoutPlanName,
                    WorkoutPlanDescription = p.WorkoutPlanDescription,
                    UserId = p.UserID,
                    ExerciseCount = p.WorkoutExercises.Count,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                });

        public async Task<ServiceResponse<List<WorkoutPlanResposneDTO>>> GetAllWorkoutPlanByUser(int userID)
        {
            var plans = await QueryForUser(userID)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return ServiceResponse<List<WorkoutPlanResposneDTO>>.Success(plans);
        }

        public async Task<ServiceResponse<WorkoutPlanResposneDTO>> GetWorkoutPlanByID(int workoutPlanID, int userID)
        {
            var plan = await QueryForUser(userID)
                .FirstOrDefaultAsync(p => p.WorkoutPlanID == workoutPlanID);

            return plan == null
                ? ServiceResponse<WorkoutPlanResposneDTO>.NotFound("Workout plan not found.")
                : ServiceResponse<WorkoutPlanResposneDTO>.Success(plan);
        }

        public async Task<ServiceResponse<WorkoutPlanResposneDTO>> CreateWorkoutPlan(int userID, CreateWorkoutPlanDTO dto)
        {
            var newPlan = new WorkoutPlan
            {
                WorkoutPlanName = dto.WorkoutPlanName.Trim(),
                WorkoutPlanDescription = dto.WorkoutPlanDescription.Trim(),
                UserID = userID,
                CreatedAt = DateTime.UtcNow
            };

            _context.WorkoutPlans.Add(newPlan);
            await _context.SaveChangesAsync();

            return await GetWorkoutPlanByID(newPlan.WorkoutPlanID, userID);
        }

        public async Task<ServiceResponse<WorkoutPlanResposneDTO>> UpdateWorkoutPlan(int planID, int userID, UpdateWorkoutPlanDTO dto)
        {
            var plan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(p => p.WorkoutPlanID == planID && p.UserID == userID);

            if (plan == null)
            {
                return ServiceResponse<WorkoutPlanResposneDTO>.NotFound("Workout plan not found.");
            }

            plan.WorkoutPlanName = dto.WorkoutPlanName.Trim();
            plan.WorkoutPlanDescription = dto.WorkoutPlanDescription.Trim();
            plan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await GetWorkoutPlanByID(plan.WorkoutPlanID, userID);
        }

        public async Task<ServiceResponse<bool>> DeleteWorkoutPlan(int userID, int planID)
        {
            var plan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(p => p.WorkoutPlanID == planID && p.UserID == userID);

            if (plan == null)
            {
                return ServiceResponse<bool>.NotFound("Workout plan not found.");
            }

            _context.WorkoutPlans.Remove(plan);
            await _context.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }
    }
}
