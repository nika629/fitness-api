using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.FoodLogs;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FoodLogController : ControllerBase
    {
        private readonly FoodLogService _foodLogService;

        public FoodLogController(FoodLogService foodLogService)
        {
            _foodLogService = foodLogService;
        }

        [HttpGet("{userID}/foodLogs")]
        public async Task<ActionResult<List<FoodLogResponseDTO>>> GetAllFoodLogByUser(int userID)
        {
            var foodLogs = await _foodLogService.GetAllFoodLogByUser(userID);

            if (foodLogs == null)
            {
                return NotFound("Food logs not found.");
            }

            return Ok(foodLogs);
        }

        [HttpGet("{userID}/foodLog/{foodLogID}")]
        public async Task<ActionResult<FoodLogResponseDTO>> GetFoodLogById(int userID, int foodLogID)
        {
            var foodLog = await _foodLogService.GetFoodLogById(foodLogID, userID);

            if (foodLog == null)
            {
                return NotFound("Food log not found.");
            }

            return Ok(foodLog);
        }

        [HttpPost("{userID}/foodLog")]
        public async Task<ActionResult<FoodLogResponseDTO>> CreateFoodLog(int userID, FoodLogCreateDTO Cdto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var foodLog = await _foodLogService.CreateFoodlog(userID, Cdto);

            if (foodLog == null)
            {
                return BadRequest("Couldn't create food log.");
            }

            return Ok(foodLog);
        }

        [HttpDelete("{userID}/foodLog/{foodLogID}")]
        public async Task<ActionResult> DeleteFoodLog(int userID, int foodLogID)
        {
            await _foodLogService.DeletefoodLog(foodLogID);

            return NoContent();
        }
    }
}