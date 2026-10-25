using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase
{
    public class ApplicationDbContext : DbContext
    {
        internal DbSet<User> Users { get; set; }
        internal DbSet<WorkoutPlan> WorkoutPlans { get; set; }
        internal DbSet<WorkoutExercise> WorkoutExercises { get; set; }
        internal DbSet<Exercise> Exercises { get; set; }
        internal DbSet<FavoriteExercise> FavoriteExercises { get; set; }
        internal DbSet<FoodLog> FoodLogs { get; set; }
        internal DbSet<Dictionary> Dictionaries { get; set; }
        internal DbSet<WorkoutSession> WorkoutSessions { get; set; }
        internal DbSet<WorkoutSessionSet> WorkoutSessionSets { get; set; }
        internal DbSet<WeightLog> WeightLogs { get; set; }


        public ApplicationDbContext(DbContextOptions options) : base(options)
        {

        }


      
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
