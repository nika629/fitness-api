namespace WebApplicationLB.Infrastructure.Services.Users
{
    public class ChangeUserEmailDTO
    {
        public string NewEmail { get; set; } = string.Empty;
        public string CurrentPassword { get; set; } = string.Empty; 
    }
}