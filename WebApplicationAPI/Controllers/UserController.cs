using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Domain.Constants;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Users;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : BaseApiController
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet("me")]
        public async Task<ActionResult<UserResponseDTO>> GetMe()
        {
            return FromResult(await _userService.GetUserById(CurrentUserId));
        }

        [HttpGet]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<ActionResult<List<UserResponseDTO>>> GetAllUsers()
        {
            return FromResult(await _userService.GetAllUsers());
        }

        [HttpPut("{userID}/assignRole")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<ActionResult<bool>> AssignRole(int userID, [FromQuery] int roleID)
        {
            return FromResult(await _userService.AssignRole(userID, roleID));
        }

        [HttpGet("{userID}")]
        public async Task<ActionResult<UserResponseDTO>> GetUserById(int userID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _userService.GetUserById(userID));
        }

        [HttpPut("{userID}")]
        public async Task<ActionResult<UserResponseDTO>> UpdateUser(int userID, UserUpdateDTO dto)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResult(await _userService.UpdateUser(userID, dto));
        }

        [HttpPut("{userID}/email")]
        public async Task<ActionResult<bool>> ChangeEmail(int userID, ChangeUserEmailDTO dto)
        {
            if (CurrentUserId != userID) return Forbid();
            return FromResult(await _userService.ChangeUserEmail(userID, dto));
        }

        [HttpPut("{userID}/password")]
        public async Task<ActionResult<bool>> ChangePassword(int userID, ChangeUserPasswordDTO dto)
        {
            if (CurrentUserId != userID) return Forbid();
            return FromResult(await _userService.ChangeUserPassword(userID, dto));
        }

        [HttpDelete("{userID}")]
        public async Task<ActionResult> DeleteUser(int userID)
        {
            if (!CanAccessUser(userID)) return Forbid();
            return FromResultNoContent(await _userService.DeleteUser(userID));
        }
    }
}
