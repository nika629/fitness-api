using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.FoodLogs;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FoodLogController : BaseApiController
    {
        private readonly FoodLogService _foodLogService;

        public FoodLogController(FoodLogService foodLogService)
        {
            _foodLogService = foodLogService;
        }

        // Optional: ?date=2026-10-15 returns only that day's logs
        [HttpGet("{userID}/foodLogs")]
        public async Task<ActionResult<List<FoodLogResponseDTO>>> GetAllFoodLogByUser(int userID, [FromQuery] DateTime? date)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _foodLogService.GetAllFoodLogByUser(userID, date));
        }

        [HttpGet("{userID}/foodLog/{foodLogID}")]
        public async Task<ActionResult<FoodLogResponseDTO>> GetFoodLogById(int userID, int foodLogID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _foodLogService.GetFoodLogById(foodLogID, userID));
        }

        [HttpPost("{userID}/foodLog")]
        public async Task<ActionResult<FoodLogResponseDTO>> CreateFoodLog(int userID, FoodLogCreateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _foodLogService.CreateFoodlog(userID, dto));
        }

        [HttpDelete("{userID}/foodLog/{foodLogID}")]
        public async Task<ActionResult> DeleteFoodLog(int userID, int foodLogID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResultNoContent(await _foodLogService.DeletefoodLog(foodLogID, userID));
        }
    }
}
