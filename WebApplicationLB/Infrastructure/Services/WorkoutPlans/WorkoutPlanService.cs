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

        public async Task<ServiceResponse<List<WorkoutPlanResposneDTO>>> GetAllWorkoutPlanByUser(int userID)
        {
            var result = new ServiceResponse<List<WorkoutPlanResposneDTO>>();

            var workoutPlans = await _context.WorkoutPlans.Where(u => u.UserID == userID)
                .Select(p => new WorkoutPlanResposneDTO
                {
                    WorkoutPlanID = p.WorkoutPlanID,
                    WorkoutPlanName = p.WorkoutPlanName,
                    WorkoutPlanDescription = p.WorkoutPlanDescription,
                    UserId = p.UserID,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                }).ToListAsync();

            if(workoutPlans == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutPlanService)}.{nameof(GetAllWorkoutPlanByUser)} - ERROR: Couldn't get all wokout plan.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = workoutPlans;
            }

            return result;
        }

        public async Task<ServiceResponse<WorkoutPlanResposneDTO>> GetWorkoutPlanByID(int workoutPlanID, int requestingUserID)
        {
            var result = new ServiceResponse<WorkoutPlanResposneDTO>();

            var workoutPlan = await _context.WorkoutPlans
        .FirstOrDefaultAsync(p => p.WorkoutPlanID == workoutPlanID);

            if (workoutPlan == null || workoutPlan.UserID != requestingUserID)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutPlanService)}.{nameof(GetWorkoutPlanByID)} - ERROR: Couldn't get workout plan by ID.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = new WorkoutPlanResposneDTO
                {
                    WorkoutPlanID = workoutPlan.WorkoutPlanID,
                    WorkoutPlanName = workoutPlan.WorkoutPlanName,
                    WorkoutPlanDescription = workoutPlan.WorkoutPlanDescription,
                    UserId = workoutPlan.UserID,
                    CreatedAt = workoutPlan.CreatedAt,
                    UpdatedAt = workoutPlan.UpdatedAt
                };
            }

            return result;
        }

        public async Task<ServiceResponse<WorkoutPlanResposneDTO>> CreateWorkoutPlan(int UserdId ,CreateWorkoutPlanDTO Cdto)
        {
            var result = new ServiceResponse<WorkoutPlanResposneDTO>();

            var newWorkoutPlan = new WorkoutPlan
            {
                WorkoutPlanName = Cdto.WorkoutPlanName,
                WorkoutPlanDescription = Cdto.WorkoutPlanDescription,
                UserID = UserdId,
                CreatedAt = DateTime.Now

            };

            if (newWorkoutPlan == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutPlanService)}.{nameof(CreateWorkoutPlan)} - ERROR: Couldn't create workoutplan.";
            }
            else
            {
                _context.WorkoutPlans.Add(newWorkoutPlan);
                await _context.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new WorkoutPlanResposneDTO
                {
                    WorkoutPlanID = newWorkoutPlan.WorkoutPlanID,
                    WorkoutPlanName = newWorkoutPlan.WorkoutPlanName,
                    WorkoutPlanDescription = newWorkoutPlan.WorkoutPlanDescription,
                    UserId = newWorkoutPlan.UserID,
                    CreatedAt = newWorkoutPlan.CreatedAt,
                    UpdatedAt = newWorkoutPlan.UpdatedAt
                };
            }



            return result;
        }

        public async Task<ServiceResponse<WorkoutPlanResposneDTO>> UpdateWorkoutPlan(int planID, int requestingUserID, UpdateWorkoutPlanDTO dto)
        {
            var result = new ServiceResponse<WorkoutPlanResposneDTO>();

            var plan = await _context.WorkoutPlans.FirstOrDefaultAsync(i => i.WorkoutPlanID == planID);

            if (plan != null || plan.UserID == requestingUserID)
            {
                plan.WorkoutPlanName = dto.WorkoutPlanName;
                plan.WorkoutPlanDescription = dto.WorkoutPlanDescription;
                plan.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new WorkoutPlanResposneDTO
                {
                    WorkoutPlanID = plan.WorkoutPlanID,
                    WorkoutPlanName = plan.WorkoutPlanName,
                    WorkoutPlanDescription = plan.WorkoutPlanDescription,
                    UserId = plan.UserID,
                    CreatedAt = plan.CreatedAt,
                    UpdatedAt = plan.UpdatedAt

                };
            }
            else
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(WorkoutPlanService)}.{nameof(UpdateWorkoutPlan)} - ERROR: couldn.t update workoutplan.";
            }

            return result;
        }

        public async Task DeleteWorkoutPlan(int userID, int planId)
        {
            var plan = await _context.WorkoutPlans.FirstOrDefaultAsync(u => u.WorkoutPlanID == planId);

            if(plan != null && plan.UserID == userID)
            {
                _context.WorkoutPlans.Remove(plan);
                await _context.SaveChangesAsync();
            }
        }
    }
}
