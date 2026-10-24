using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Exercises
{
    // Every field is optional: send only what you want to change.
    public class ExerciseUpdateDTO
    {
        [StringLength(100)]
        public string? ExerciseName { get; set; }

        [StringLength(1000)]
        public string? ExerciseDescription { get; set; }

        [StringLength(30)]
        public string? ExerciseDifficulty { get; set; }

        public int? MuscleGroupID { get; set; }

        public int? EquipmentID { get; set; }
    }
}
