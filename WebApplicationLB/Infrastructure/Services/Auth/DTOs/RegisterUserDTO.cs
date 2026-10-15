namespace WebApplicationLB.Infrastructure.Services.Auth
{
    public class RegisterUserDTO
    {
        public string UserName { get; set; } = string.Empty;
        public string UserLastname { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string UserPassword { get; set; } = string.Empty;
    }
}