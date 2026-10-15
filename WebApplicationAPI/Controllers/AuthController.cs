using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Auth;

namespace WebApplicationAPI.Controllers
{
    [ApiController]           
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterUserDTO Rdto)
        {
            var result = await _authService.RegisterUser(Rdto);
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginUserDTO Ldto)
        {
            var result = await _authService.LoginUser(Ldto);
            return Ok(result);
        }
    }
}
