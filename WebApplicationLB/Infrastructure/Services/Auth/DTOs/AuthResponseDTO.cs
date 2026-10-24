namespace WebApplicationLB.Infrastructure.Services.Auth
{
    public class AuthResponseDTO
    {
        public string Token { get; set; } = string.Empty;
        public int UserID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
