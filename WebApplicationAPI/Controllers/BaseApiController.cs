using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Constants;

namespace WebApplicationAPI.Controllers
{
    public abstract class BaseApiController : ControllerBase
    {
        // UserID from the JWT token (0 when not logged in)
        protected int CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        protected bool IsAdmin => User.IsInRole(RoleNames.Admin);

        // A user may only touch their own data; an Admin may touch everyone's
        protected bool CanAccessUser(int userID) => IsAdmin || CurrentUserId == userID;

        // Turns a ServiceResponse into the right HTTP response
        protected ActionResult FromResult<T>(ServiceResponse<T> result)
        {
            if (result.IsSuccessful)
            {
                return Ok(result.Data);
            }

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        // Same as FromResult, but returns 204 No Content on success (for DELETE)
        protected ActionResult FromResultNoContent<T>(ServiceResponse<T> result)
        {
            if (result.IsSuccessful)
            {
                return NoContent();
            }

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
