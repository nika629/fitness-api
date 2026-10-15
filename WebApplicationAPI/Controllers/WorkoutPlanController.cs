using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.WorkoutPlans;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutPlanController : ControllerBase
    {
        private readonly WorkoutPlanService _workoutPlanService;

        public WorkoutPlanController(WorkoutPlanService workoutPlanService)
        {
            _workoutPlanService = workoutPlanService;
        }

        [HttpGet("{userID}/workout-plans")]
        public async Task<ActionResult<List<WorkoutPlanResposneDTO>>> GetAllWorkoutPlans(int userID)
        {
            var result = await _workoutPlanService.GetAllWorkoutPlanByUser(userID);

            if (!result.IsSuccessful)
            {
                return BadRequest(result.ErrorMessage);
            }

            return Ok(result.Data);
        }

        [HttpGet("{userID}/workout-plans/{planID}")]
        public async Task<ActionResult<WorkoutPlanResposneDTO>> GetWorkoutPlanByID(int userID, int planID)
        {
            var result = await _workoutPlanService.GetWorkoutPlanByID(planID, userID);

            if (!result.IsSuccessful)
            {
                return NotFound(result.ErrorMessage);
            }

            return Ok(result.Data);
        }

        [HttpPost("{userID}/workout-plans")]
        public async Task<ActionResult<WorkoutPlanResposneDTO>> CreateWorkoutPlan(int userID, CreateWorkoutPlanDTO Cdto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _workoutPlanService.CreateWorkoutPlan(userID, Cdto);

            if (!result.IsSuccessful)
            {
                return BadRequest(result.ErrorMessage);
            }

            return CreatedAtAction(nameof(GetWorkoutPlanByID),
                new { userID = userID, planID = result.Data.WorkoutPlanID },
                result.Data);
        }

        [HttpPut("{userID}/workout-plans/{planID}")]
        public async Task<ActionResult<WorkoutPlanResposneDTO>> UpdateWorkoutPlan(int userID, int planID, UpdateWorkoutPlanDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _workoutPlanService.UpdateWorkoutPlan(planID, userID, dto);

            if (!result.IsSuccessful)
            {
                return NotFound(result.ErrorMessage);
            }

            return Ok(result.Data);
        }

        [HttpDelete("{userID}/workout-plans/{planID}")]
        public async Task<ActionResult> DeleteWorkoutPlan(int userID, int planID)
        {
            await _workoutPlanService.DeleteWorkoutPlan(userID, planID);

            return NoContent();
        }
    }
}