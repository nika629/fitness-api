namespace WebApplicationLB.Infrastructure.Services.WorkoutPlans
{
    public class WorkoutPlanResposneDTO
    {
        public int WorkoutPlanID { get; set; }
        public string WorkoutPlanName { get; set; } = string.Empty;
        public string WorkoutPlanDescription { get; set; } = string.Empty;
        public int UserId { get; set; }
        public int ExerciseCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
