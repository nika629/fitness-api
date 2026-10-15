namespace WebApplicationLB.Infrastructure.Services.Users
{
    public class UserUpdateDTO
    {
        public string UserName { get; set; } = string.Empty;
        public string UserLastName {  get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public int? UserAge { get; set; }
        public DateTime? BirthDate { get; set; }
        public double? Height { get; set; }
        public double? CurrentWeight { get; set; }
        public double? GoalWeight { get; set; }

    }
}