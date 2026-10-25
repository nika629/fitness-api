namespace WebApplicationLB.Domain.Entities
{
    internal record Exercise
    {
        public int ExerciseID { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string ExerciseDescription { get; set; } = string.Empty;
        public string ExerciseDifficulty { get; set; } = string.Empty;
        public int MuscleGroupDictionaryID { get; set; } 
        public int? EquipmentDictionaryID { get; set; } 
        public DateTime CreateAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public List<WorkoutExercise> WorkoutExercises { get; set; } = [];
        public List<FavoriteExercise> FavoriteExercises { get; set; } = [];
        public List<WorkoutSessionSet> SessionSets { get; set; } = [];
        public Dictionary? DictionaryMuscleGroup { get; set; }
        public Dictionary? DictionaryEquipment { get; set; }
    }
}