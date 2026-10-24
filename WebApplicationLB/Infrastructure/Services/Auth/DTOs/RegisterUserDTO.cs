using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Auth
{
    public class RegisterUserDTO
    {
        [Required, StringLength(50)]
        public string UserName { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string UserLastname { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(100)]
        public string UserEmail { get; set; } = string.Empty;

        [StringLength(20)]
        public string UserPhone { get; set; } = string.Empty;

        [Required, MinLength(6), StringLength(100)]
        public string UserPassword { get; set; } = string.Empty;
    }
}
