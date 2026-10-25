using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.WorkoutSessions
{
    // What the app sends when the user presses "Finish workout"
    public class WorkoutSessionCreateDTO
    {
        // Optional: null = a free workout without a plan
        public int? WorkoutPlanID { get; set; }

        [Required]
        public DateTime StartedAt { get; set; }

        [Required]
        public DateTime FinishedAt { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [Required, MinLength(1, ErrorMessage = "A workout needs at least one set.")]
        public List<WorkoutSessionSetDTO> Sets { get; set; } = [];
    }
}
