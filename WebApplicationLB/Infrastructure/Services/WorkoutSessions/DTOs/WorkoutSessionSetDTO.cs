using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.WorkoutSessions
{
    // One set inside WorkoutSessionCreateDTO
    public class WorkoutSessionSetDTO
    {
        [Range(1, int.MaxValue)]
        public int ExerciseID { get; set; }

        [Range(1, 50)]
        public int SetNumber { get; set; }

        [Range(0, 1000)]
        public int Reps { get; set; }

        // Null for bodyweight exercises
        [Range(0, 1000)]
        public double? WeightKg { get; set; }
    }
}
