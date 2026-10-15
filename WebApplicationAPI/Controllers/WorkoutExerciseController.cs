using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.WorkoutExercises;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutExerciseController : ControllerBase
    {
        private readonly WorkoutExerciseService _workoutExerciseService;

        public WorkoutExerciseController(WorkoutExerciseService workoutExerciseService)
        {
            _workoutExerciseService = workoutExerciseService;
        }

        [HttpGet("{userID}/plans/{planID}/workout-exercises")]
        public async Task<ActionResult<List<WorkoutExerciseResponseDTO>>> GetAllWorkoutExercises(int userID, int planID)
        {
            var workoutExercises = await _workoutExerciseService.GetAllWorkoutExercisesByPlan(planID, userID);

            if (workoutExercises == null)
            {
                return NotFound("Workout exercises not found.");
            }

            return Ok(workoutExercises);
        }

        [HttpGet("{userID}/user/{workoutExerciseID}/workout-exercise")]
        public async Task<ActionResult<WorkoutExerciseResponseDTO>> GetWorkoutExerciseByID(int userID, int workoutExerciseID)
        {
            var workoutExercise = await _workoutExerciseService.GetWorkoutExerciseByID(userID, workoutExerciseID);

            if (workoutExercise == null)
            {
                return NotFound("Workout exercise not found.");
            }

            return Ok(workoutExercise);
        }

        [HttpPost("{userID}/workout-exercise")]
        public async Task<ActionResult<WorkoutExerciseResponseDTO>> CreateWorkoutExercise(int userID, WorkoutExerciseCreateDTO Cdto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newWorkoutExercise = await _workoutExerciseService.CreateWorkoutExercise(userID, Cdto);

            if (newWorkoutExercise == null)
            {
                return BadRequest("Couldn't create workout exercise.");
            }

            return Ok(newWorkoutExercise);
        }

        [HttpPut("{userID}/user/{workoutExerciseID}/workout-exercise")]
        public async Task<ActionResult<WorkoutExerciseResponseDTO>> UpdateWorkoutExercise(int userID, int workoutExerciseID, WorkoutExerciseUpdateDTO Udto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedWorkoutExercise = await _workoutExerciseService.UpdateWorkoutExercise(userID, workoutExerciseID, Udto);  

            if (updatedWorkoutExercise == null)
            {
                return NotFound("Couldn't update workout exercise.");
            }

            return Ok(updatedWorkoutExercise);
        }

        [HttpDelete("{userID}/user/{workoutExerciseID}/workout-exercise")]
        public async Task<ActionResult> DeleteWorkoutExercise(int userID, int workoutExerciseID)
        {
            await _workoutExerciseService.DeleteWorkoutExercise(workoutExerciseID, userID);

            return NoContent();
        }
    }
}