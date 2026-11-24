using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Constants;

namespace WebApplicationAPI.Controllers
{
    public abstract class BaseApiController : ControllerBase
    {
        protected int CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        protected bool IsAdmin => User.IsInRole(RoleNames.Admin);

        protected bool CanAccessUser(int userID) => IsAdmin || CurrentUserId == userID;

        protected ActionResult FromResult<T>(ServiceResponse<T> result)
        {
            if (result.IsSuccessful)
            {
                return Ok(result.Data);
            }

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

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
