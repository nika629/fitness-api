namespace WebApplicationLB.Domain.Entities
{
    internal record WorkoutPlan
    {
        public int WorkoutPlanID { get; set; }
        public string WorkoutPlanName { get; set; } = string.Empty;
        public string WorkoutPlanDescription { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public int UserID { get; set; }
        public User? User { get; set; }

        public List<WorkoutExercise> WorkoutExercises { get; set; } = [];
        public List<WorkoutSession> WorkoutSessions { get; set; } = [];
    }
}