using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.WeightLogs;

namespace WebApplicationAPI.Controllers
{
    // Body weight history (progress chart)
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WeightLogController : BaseApiController
    {
        private readonly WeightLogService _weightLogService;

        public WeightLogController(WeightLogService weightLogService)
        {
            _weightLogService = weightLogService;
        }

        [HttpGet("{userID}/weight-logs")]
        public async Task<ActionResult<List<WeightLogResponseDTO>>> GetWeightLogs(int userID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _weightLogService.GetWeightLogs(userID));
        }

        [HttpPost("{userID}/weight-logs")]
        public async Task<ActionResult<WeightLogResponseDTO>> CreateWeightLog(int userID, WeightLogCreateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _weightLogService.CreateWeightLog(userID, dto));
        }
    }
}
