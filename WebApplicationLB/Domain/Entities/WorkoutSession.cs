namespace WebApplicationLB.Domain.Entities
{
    
    internal record WorkoutSession
    {
        public int WorkoutSessionID { get; set; }
        public int UserID { get; set; }
        public User? User { get; set; }
        public int? WorkoutPlanID { get; set; }
        public WorkoutPlan? WorkoutPlan { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime FinishedAt { get; set; }
        public int DurationMinutes { get; set; }
        public string? Notes { get; set; }
        public List<WorkoutSessionSet> Sets { get; set; } = [];
    }
}
