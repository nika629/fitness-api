using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.WorkoutExercises;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutExerciseController : BaseApiController
    {
        private readonly WorkoutExerciseService _workoutExerciseService;

        public WorkoutExerciseController(WorkoutExerciseService workoutExerciseService)
        {
            _workoutExerciseService = workoutExerciseService;
        }

        [HttpGet("{userID}/plans/{planID}/workout-exercises")]
        public async Task<ActionResult<List<WorkoutExerciseResponseDTO>>> GetAllWorkoutExercises(int userID, int planID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutExerciseService.GetAllWorkoutExercisesByPlan(planID, userID));
        }

        [HttpGet("{userID}/workout-exercises/{workoutExerciseID}")]
        public async Task<ActionResult<WorkoutExerciseResponseDTO>> GetWorkoutExerciseByID(int userID, int workoutExerciseID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutExerciseService.GetWorkoutExerciseByID(userID, workoutExerciseID));
        }

        [HttpPost("{userID}/workout-exercises")]
        public async Task<ActionResult<WorkoutExerciseResponseDTO>> CreateWorkoutExercise(int userID, WorkoutExerciseCreateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutExerciseService.CreateWorkoutExercise(userID, dto));
        }

        [HttpPut("{userID}/workout-exercises/{workoutExerciseID}")]
        public async Task<ActionResult<WorkoutExerciseResponseDTO>> UpdateWorkoutExercise(int userID, int workoutExerciseID, WorkoutExerciseUpdateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutExerciseService.UpdateWorkoutExercise(userID, workoutExerciseID, dto));
        }

        [HttpDelete("{userID}/workout-exercises/{workoutExerciseID}")]
        public async Task<ActionResult> DeleteWorkoutExercise(int userID, int workoutExerciseID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResultNoContent(await _workoutExerciseService.DeleteWorkoutExercise(workoutExerciseID, userID));
        }
    }
}
