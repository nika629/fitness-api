namespace WebApplicationLB.Domain.Entities
{
   
    internal record WorkoutSessionSet
    {
        public int WorkoutSessionSetID { get; set; }
        public int WorkoutSessionID { get; set; }
        public WorkoutSession? WorkoutSession { get; set; }
        public int ExerciseID { get; set; }
        public Exercise? Exercise { get; set; }
        public int SetNumber { get; set; }
        public int Reps { get; set; }
        public double? WeightKg { get; set; }
    }
}
