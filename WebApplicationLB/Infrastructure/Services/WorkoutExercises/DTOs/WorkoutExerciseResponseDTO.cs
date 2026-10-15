namespace WebApplicationLB.Infrastructure.Services.WorkoutExercises
{
    public class WorkoutExerciseResponseDTO
    {
        public int WorkoutExerciseID { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public int RestTime { get; set; }
        public int OrderNumber { get; set; }
        public int WorkoutPlanID { get; set; }
        public int ExerciseID { get; set; }
        public string ExerciseName { get; set; } = string.Empty;   
    }
}