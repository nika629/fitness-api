using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.WorkoutExercises
{
    public class WorkoutExerciseCreateDTO
    {
        [Range(1, int.MaxValue)]
        public int WorkoutPlanID { get; set; }

        [Range(1, int.MaxValue)]
        public int ExerciseID { get; set; }

        [Range(1, 100)]
        public int Sets { get; set; }

        [Range(1, 1000)]
        public int Reps { get; set; }

        // seconds
        [Range(0, 3600)]
        public int RestTime { get; set; }

        [Range(0, 1000)]
        public int OrderNumber { get; set; }
    }
}
