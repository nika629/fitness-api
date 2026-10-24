using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Users
{
    public class ChangeUserPasswordDTO
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required, MinLength(6), StringLength(100)]
        public string NewPassword { get; set; } = string.Empty;

        [Required, Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
