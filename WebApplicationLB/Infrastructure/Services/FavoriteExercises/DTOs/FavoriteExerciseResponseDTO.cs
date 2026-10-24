namespace WebApplicationLB.Infrastructure.Services.FavoriteExercises
{
    public class FavoriteExerciseResponseDTO
    {
        public int ExerciseID { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string ExerciseDescription { get; set; } = string.Empty;
        public string ExerciseDifficulty { get; set; } = string.Empty;
        public string? MuscleGroupName { get; set; }
        public string? EquipmentName { get; set; }
    }
}
