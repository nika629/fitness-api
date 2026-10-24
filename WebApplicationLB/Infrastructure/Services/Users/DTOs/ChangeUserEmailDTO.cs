using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Users
{
    public class ChangeUserEmailDTO
    {
        [Required, EmailAddress, StringLength(100)]
        public string NewEmail { get; set; } = string.Empty;

        [Required]
        public string CurrentPassword { get; set; } = string.Empty;
    }
}
