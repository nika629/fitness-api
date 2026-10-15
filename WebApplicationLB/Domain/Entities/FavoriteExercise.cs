namespace WebApplicationLB.Domain.Entities
{
    internal record FavoriteExercise
    {
        public int UserID { get; set; }
        public User? User { get; set; }

        public int ExerciseID { get; set; }
        public Exercise? Exercise { get; set; }
    }
}   