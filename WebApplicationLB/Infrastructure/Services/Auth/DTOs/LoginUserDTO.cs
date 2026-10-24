using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Auth
{
    public class LoginUserDTO
    {
        [Required, EmailAddress]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        public string UserPassword { get; set; } = string.Empty;
    }
}
