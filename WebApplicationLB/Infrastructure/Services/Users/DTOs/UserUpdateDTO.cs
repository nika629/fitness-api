using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Users
{
    // Every field is optional: send only what you want to change.
    public class UserUpdateDTO
    {
        [StringLength(50)]
        public string? UserName { get; set; }

        [StringLength(50)]
        public string? UserLastName { get; set; }

        [StringLength(20)]
        public string? UserPhone { get; set; }

        [Range(1, 120)]
        public int? UserAge { get; set; }

        public DateTime? BirthDate { get; set; }

        [Range(50, 260)]
        public double? Height { get; set; }

        [Range(20, 400)]
        public double? CurrentWeight { get; set; }

        [Range(20, 400)]
        public double? GoalWeight { get; set; }
    }
}
