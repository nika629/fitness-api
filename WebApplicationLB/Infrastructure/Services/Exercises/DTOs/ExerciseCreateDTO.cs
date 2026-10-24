using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Exercises
{
    public class ExerciseCreateDTO
    {
        [Required, StringLength(100)]
        public string ExerciseName { get; set; } = string.Empty;

        [StringLength(1000)]
        public string ExerciseDescription { get; set; } = string.Empty;

        [Required, StringLength(30)]
        public string ExerciseDifficulty { get; set; } = string.Empty;

        // DictionaryID of a muscle group (group 3)
        [Range(1, int.MaxValue)]
        public int MuscleGroupID { get; set; }

        // DictionaryID of equipment (group 2), optional
        public int? EquipmentID { get; set; }
    }
}
