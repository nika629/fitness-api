using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Exercises;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ExerciseController : ControllerBase
    {
        private readonly ExerciseService _exerciseService;

        public ExerciseController(ExerciseService exerciseService)
        {
            _exerciseService = exerciseService;
        }

        [HttpGet("exercises")]
        public async Task<ActionResult<List<ExerciseResponseDTO>>> GetAllExercise()
        {
            var exercises = await _exerciseService.GetAllExercises();

            if (exercises == null)
            {
                return NotFound("Exercises not found");
            }

            return Ok(exercises);
        }

        [HttpGet("{exerciseID}")]
        public async Task<ActionResult<ExerciseResponseDTO>> GetExerciseByID(int exerciseID)
        {
            var exercise = await _exerciseService.GetExerciseByID(exerciseID);

            if (exercise == null)
            {
                return NotFound("Exercise not found");
            }

            return Ok(exercise);
        }

        [HttpPost("exercise")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ExerciseResponseDTO>> CreateExercise(ExerciseCreateDTO Cdto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var exercise = await _exerciseService.CreateExercise(Cdto);

            if (exercise == null)
            {
                return BadRequest("Couldn't create exercise");
            }

            return Ok(exercise);
        }

        [HttpPut("{exerciseID}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ExerciseResponseDTO>> UpdateExercise(int exerciseID, ExerciseUpdateDTO Udto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var exercise = await _exerciseService.UpdateExercise(exerciseID, Udto);

            if (exercise == null)
            {
                return NotFound("Exercise not found");
            }

            return Ok(exercise);
        }

        [HttpDelete("{exerciseID}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<string>> DeleteExercise(int exerciseID)
        {
            await _exerciseService.DeleteExercise(exerciseID);

            return Ok("Exercise deleted successfully");
        }
    }
}