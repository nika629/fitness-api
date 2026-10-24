using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.FavoriteExercises;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FavoriteExerciseController : BaseApiController
    {
        private readonly FavoriteExerciseService _favoriteExerciseService;

        public FavoriteExerciseController(FavoriteExerciseService favoriteExerciseService)
        {
            _favoriteExerciseService = favoriteExerciseService;
        }

        [HttpGet("{userID}/favoriteExercises")]
        public async Task<ActionResult<List<FavoriteExerciseResponseDTO>>> GetAllFavoriteExercisesByUser(int userID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _favoriteExerciseService.GetAllFavoritesByUser(userID));
        }

        // exerciseID = the ID of the exercise that is in favorites
        [HttpGet("{userID}/favoriteExercise/{exerciseID}")]
        public async Task<ActionResult<FavoriteExerciseResponseDTO>> GetFavoriteExerciseById(int userID, int exerciseID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _favoriteExerciseService.GetFavoriteExerciseByID(exerciseID, userID));
        }

        [HttpPost("{userID}/favoriteExercise")]
        public async Task<ActionResult<FavoriteExerciseResponseDTO>> CreateFavorite(int userID, FavoriteExerciseCreateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _favoriteExerciseService.CreateFavoriteExercise(userID, dto));
        }

        [HttpDelete("{userID}/favoriteExercise/{exerciseID}")]
        public async Task<ActionResult> DeleteFavorite(int userID, int exerciseID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResultNoContent(await _favoriteExerciseService.DeleteFavoriteExercise(exerciseID, userID));
        }
    }
}
