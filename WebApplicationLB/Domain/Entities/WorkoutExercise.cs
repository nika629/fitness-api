namespace WebApplicationLB.Domain.Entities
{
    internal record WorkoutExercise
    {
        public int WorkoutExerciseID { get; set; }
        public int Sets { get; set; } = 0;
        public int Reps { get; set; } = 0; 
        public int RestTime { get; set; } = 0;
        public int OrderNumber { get; set; } = 0;

        public int WorkoutPlanID { get; set; }
        public WorkoutPlan? WorkoutPlan { get; set; }
            
        public int ExerciseID { get; set; }
        public Exercise? Exercise { get; set; }
    }
}