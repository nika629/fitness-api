namespace WebApplicationLB.Infrastructure.Services.Exercises
{
    public class ExerciseResponseDTO
    {
        public int ExerciseID { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string ExerciseDescription { get; set; } = string.Empty;
        public string ExerciseDifficulty { get; set; } = string.Empty;
        public int MuscleGroupID { get; set; } 
        public int? EquipmentID { get; set; } 
        public DateTime CreateAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
