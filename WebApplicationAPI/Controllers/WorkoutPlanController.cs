using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.WorkoutPlans;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutPlanController : BaseApiController
    {
        private readonly WorkoutPlanService _workoutPlanService;

        public WorkoutPlanController(WorkoutPlanService workoutPlanService)
        {
            _workoutPlanService = workoutPlanService;
        }

        [HttpGet("{userID}/workout-plans")]
        public async Task<ActionResult<List<WorkoutPlanResposneDTO>>> GetAllWorkoutPlans(int userID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutPlanService.GetAllWorkoutPlanByUser(userID));
        }

        [HttpGet("{userID}/workout-plans/{planID}")]
        public async Task<ActionResult<WorkoutPlanResposneDTO>> GetWorkoutPlanByID(int userID, int planID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutPlanService.GetWorkoutPlanByID(planID, userID));
        }

        [HttpPost("{userID}/workout-plans")]
        public async Task<ActionResult<WorkoutPlanResposneDTO>> CreateWorkoutPlan(int userID, CreateWorkoutPlanDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutPlanService.CreateWorkoutPlan(userID, dto));
        }

        [HttpPut("{userID}/workout-plans/{planID}")]
        public async Task<ActionResult<WorkoutPlanResposneDTO>> UpdateWorkoutPlan(int userID, int planID, UpdateWorkoutPlanDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutPlanService.UpdateWorkoutPlan(planID, userID, dto));
        }

        [HttpDelete("{userID}/workout-plans/{planID}")]
        public async Task<ActionResult> DeleteWorkoutPlan(int userID, int planID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResultNoContent(await _workoutPlanService.DeleteWorkoutPlan(userID, planID));
        }
    }
}
