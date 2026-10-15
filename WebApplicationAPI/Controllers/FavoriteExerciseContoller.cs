using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.FavoriteExercises;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FavoriteExerciseContoller : ControllerBase
    {
        private readonly FavoriteExerciseService _favoriteExerciseService;

        public FavoriteExerciseContoller(FavoriteExerciseService favoriteExerciseService)
        {
            _favoriteExerciseService = favoriteExerciseService;
        }

        [HttpGet("{userID}/favoriteExercises")]
        public async Task<ActionResult<List<FavoriteExerciseResponseDTO>>> GetAllFavoriteExercisesByUser(int userID)
        {
            var favoriteExercises = await _favoriteExerciseService.GetAllFavoritesByUser(userID);

            if (favoriteExercises == null)
            {
                return NotFound("Favorite exercises not found.");
            }

            return Ok(favoriteExercises);
        }

        [HttpGet("{userID}/favoriteExercise/{favoriteID}")]
        public async Task<ActionResult<FavoriteExerciseResponseDTO>> GetFavoriteExerciseById(int userID, int favoriteID)
        {
            var favoriteExercise = await _favoriteExerciseService.GetFavoriteExerciseByID(favoriteID, userID);

            if (favoriteExercise == null)
            {
                return NotFound("Favorite exercise not found.");
            }

            return Ok(favoriteExercise);
        }

        [HttpPost("{userID}/favoriteExercise")]
        public async Task<ActionResult<FavoriteExerciseResponseDTO>> CreateFavorite(int userID, FavoriteExerciseCreateDTO Cdto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var favorite = await _favoriteExerciseService.CreateFavoriteExercise(userID, Cdto);

            if (favorite == null)
            {
                return BadRequest("Couldn't create favorite exercise.");
            }

            return Ok(favorite);
        }

        [HttpDelete("{userID}/favoriteExercise/{favoriteID}")]
        public async Task<ActionResult> DeleteFavorite(int userID, int favoriteID)
        {
            await _favoriteExerciseService.DeleteFavoriteExercise(favoriteID, userID);

            return NoContent();
        }
    }
}
