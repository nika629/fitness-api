using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Users;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPut("{userID}/assignRole")]
        
        public async Task<ActionResult> AssignRole(int userID, int roleID)
        {
            await _userService.AssignRole(userID, roleID);

            return Ok("Role assigned to user successfully.");
        }

        [HttpGet("{userID}")]
        public async Task<ActionResult<UserResponseDTO>> GetUserById(int userID)
        {
            var user = await _userService.GetUserById(userID);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(user);
        }

        [HttpPut("{userID}")]
        public async Task<ActionResult<UserResponseDTO>> UpdateUser(int userID, UserUpdateDTO Udto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.UpdateUser(userID, Udto);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(user);
        }

        [HttpPut("{userID}/email")]
        public async Task<ActionResult> ChangeEmail(int userID, ChangeUserEmailDTO CEdto)
        {
            await _userService.ChangeUserEmail(userID, CEdto);

            return Ok("Email updated successfully.");
        }

        [HttpPut("{userID}/password")]
        public async Task<ActionResult> ChangePassword(int userID, ChangeUserPasswordDTO CPdto)
        {
            await _userService.ChangeUserPassword(userID, CPdto);

            return Ok("Password updated successfully.");
        }

        [HttpDelete("{userID}")]
        public async Task<ActionResult> DeleteUser(int userID)
        {
            await _userService.DeleteUser(userID);

            return NoContent();
        }
    }
}