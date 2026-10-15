namespace WebApplicationLB.Infrastructure.Services.Users
{
    public class ChangeUserPasswordDTO
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfrimNewPassword {  get; set; } = string.Empty;
    }
}