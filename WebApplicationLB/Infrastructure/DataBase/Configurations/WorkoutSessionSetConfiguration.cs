using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class WorkoutSessionSetConfiguration : IEntityTypeConfiguration<WorkoutSessionSet>
    {
        public void Configure(EntityTypeBuilder<WorkoutSessionSet> builder)
        {
            builder.ToTable("WorkoutSessionSets");

            builder.HasKey(s => s.WorkoutSessionSetID);

            builder.Property(s => s.SetNumber).IsRequired();
            builder.Property(s => s.Reps).IsRequired();

            // Session deleted -> its sets are deleted with it
            builder.HasOne(s => s.WorkoutSession)
                .WithMany(w => w.Sets)
                .HasForeignKey(s => s.WorkoutSessionID)
                .OnDelete(DeleteBehavior.Cascade);

            // An exercise that appears in someone's history cannot be deleted
            builder.HasOne(s => s.Exercise)
                .WithMany(e => e.SessionSets)
                .HasForeignKey(s => s.ExerciseID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
