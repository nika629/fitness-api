using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.WorkoutPlans
{
    public class CreateWorkoutPlanDTO
    {
        [Required, StringLength(100)]
        public string WorkoutPlanName { get; set; } = string.Empty;

        [StringLength(1000)]
        public string WorkoutPlanDescription { get; set; } = string.Empty;
    }
}
