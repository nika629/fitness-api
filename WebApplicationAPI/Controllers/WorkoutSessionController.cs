using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.WorkoutSessions;

namespace WebApplicationAPI.Controllers
{
    // Finished workouts (workout history)
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutSessionController : BaseApiController
    {
        private readonly WorkoutSessionService _workoutSessionService;

        public WorkoutSessionController(WorkoutSessionService workoutSessionService)
        {
            _workoutSessionService = workoutSessionService;
        }

        [HttpGet("{userID}/workout-sessions")]
        public async Task<ActionResult<List<WorkoutSessionResponseDTO>>> GetSessions(int userID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutSessionService.GetSessionsByUser(userID));
        }

        [HttpGet("{userID}/workout-sessions/{sessionID}")]
        public async Task<ActionResult<WorkoutSessionResponseDTO>> GetSession(int userID, int sessionID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutSessionService.GetSessionById(sessionID, userID));
        }

        [HttpPost("{userID}/workout-sessions")]
        public async Task<ActionResult<WorkoutSessionResponseDTO>> CreateSession(int userID, WorkoutSessionCreateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _workoutSessionService.CreateSession(userID, dto));
        }

        [HttpDelete("{userID}/workout-sessions/{sessionID}")]
        public async Task<ActionResult> DeleteSession(int userID, int sessionID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResultNoContent(await _workoutSessionService.DeleteSession(sessionID, userID));
        }
    }
}
