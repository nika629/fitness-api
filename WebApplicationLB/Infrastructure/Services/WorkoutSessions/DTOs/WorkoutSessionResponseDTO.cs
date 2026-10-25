namespace WebApplicationLB.Infrastructure.Services.WorkoutSessions
{
    public class WorkoutSessionResponseDTO
    {
        public int WorkoutSessionID { get; set; }
        public int UserID { get; set; }
        public int? WorkoutPlanID { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime FinishedAt { get; set; }
        public int DurationMinutes { get; set; }
        public string? Notes { get; set; }

        // Totals calculated on the server
        public int TotalSets { get; set; }
        public int TotalReps { get; set; }
        public double TotalVolumeKg { get; set; }   // sum of reps x weight

        // Filled only when one session is requested (the list leaves it empty)
        public List<WorkoutSessionSetResponseDTO> Sets { get; set; } = [];
    }

    public class WorkoutSessionSetResponseDTO
    {
        public int WorkoutSessionSetID { get; set; }
        public int ExerciseID { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public int SetNumber { get; set; }
        public int Reps { get; set; }
        public double? WeightKg { get; set; }
    }
}
