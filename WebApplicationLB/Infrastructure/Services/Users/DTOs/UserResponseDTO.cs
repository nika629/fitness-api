namespace WebApplicationLB.Infrastructure.Services.Users
{
    public class UserResponseDTO
    {
        public int UserID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserLastName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string UserRoleName {  get; set; } = string.Empty;
        public int? UserAge { get; set; }
        public DateTime? BirthDate { get; set; }
        public double? Height { get; set; }
        public double? CurrentWeight { get; set; }
        public double? GoalWeight { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}