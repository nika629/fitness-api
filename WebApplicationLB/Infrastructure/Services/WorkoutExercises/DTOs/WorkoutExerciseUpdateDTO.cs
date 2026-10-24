using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.WorkoutExercises
{
    // Every field is optional: send only what you want to change.
    public class WorkoutExerciseUpdateDTO
    {
        [Range(1, 100)]
        public int? Sets { get; set; }

        [Range(1, 1000)]
        public int? Reps { get; set; }

        [Range(0, 3600)]
        public int? RestTime { get; set; }

        [Range(0, 1000)]
        public int? OrderNumber { get; set; }
    }
}
