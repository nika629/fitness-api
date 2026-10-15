using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class WorkoutExerciseConfiguration : IEntityTypeConfiguration<WorkoutExercise>
    {
        public void Configure(EntityTypeBuilder<WorkoutExercise> builder)
        {
            builder.ToTable("WorkoutExercises");

            builder.HasKey(w => w.WorkoutExerciseID);

            builder.Property(w => w.Sets).IsRequired();
            builder.Property(w => w.Reps).IsRequired();
            builder.Property(w => w.RestTime).IsRequired();
            builder.Property(w => w.OrderNumber).IsRequired();

            builder.HasOne(w => w.WorkoutPlan)
                .WithMany(wp => wp.WorkoutExercises)
                .HasForeignKey(w => w.WorkoutPlanID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(w => w.Exercise)
                .WithMany(e => e.WorkoutExercises)
                .HasForeignKey(w => w.ExerciseID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}