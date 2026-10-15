namespace WebApplicationLB.Domain.Entities
{
    internal record User
    {
        public int UserID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserLastName { get; set; } = string.Empty;
        public int? UserAge { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string UserPasswordHash { get; set; } = string.Empty;
        public DateTime? BirthDate { get; set; }

        public double? Height { get; set; }
        public double? CurrentWeight { get; set; }
        public double? GoalWeight { get; set; }
        public int? UserDictionaryRoleID { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Dictionary? DictionaryRole { get; set; }
        public List<WorkoutPlan> WorkoutPlans { get; set; } = [];
        public List<FavoriteExercise> FavoriteExercises { get; set; } = [];
        public List<FoodLog> FoodLogs { get; set; } = [];
    }
}