using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Domain.Constants;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Exercises;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ExerciseController : BaseApiController
    {
        private readonly ExerciseService _exerciseService;

        public ExerciseController(ExerciseService exerciseService)
        {
            _exerciseService = exerciseService;
        }

        // Optional filters: ?muscleGroupId=12&equipmentId=3&search=press
        [HttpGet("exercises")]
        public async Task<ActionResult<List<ExerciseResponseDTO>>> GetAllExercises(
            [FromQuery] int? muscleGroupId, [FromQuery] int? equipmentId, [FromQuery] string? search)
        {
            return FromResult(await _exerciseService.GetAllExercises(muscleGroupId, equipmentId, search));
        }

        [HttpGet("{exerciseID}")]
        public async Task<ActionResult<ExerciseResponseDTO>> GetExerciseByID(int exerciseID)
        {
            return FromResult(await _exerciseService.GetExerciseByID(exerciseID));
        }

        [HttpPost("exercise")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<ActionResult<ExerciseResponseDTO>> CreateExercise(ExerciseCreateDTO dto)
        {
            return FromResult(await _exerciseService.CreateExercise(dto));
        }

        [HttpPut("{exerciseID}")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<ActionResult<ExerciseResponseDTO>> UpdateExercise(int exerciseID, ExerciseUpdateDTO dto)
        {
            return FromResult(await _exerciseService.UpdateExercise(exerciseID, dto));
        }

        [HttpDelete("{exerciseID}")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<ActionResult> DeleteExercise(int exerciseID)
        {
            return FromResultNoContent(await _exerciseService.DeleteExercise(exerciseID));
        }
    }
}
