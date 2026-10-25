using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class WorkoutSessionConfiguration : IEntityTypeConfiguration<WorkoutSession>
    {
        public void Configure(EntityTypeBuilder<WorkoutSession> builder)
        {
            builder.ToTable("WorkoutSessions");

            builder.HasKey(s => s.WorkoutSessionID);

            builder.Property(s => s.PlanName).IsRequired().HasMaxLength(100);
            builder.Property(s => s.Notes).HasMaxLength(500);
            builder.Property(s => s.StartedAt).IsRequired();
            builder.Property(s => s.FinishedAt).IsRequired();

            // User deleted -> their workout history is deleted too
            builder.HasOne(s => s.User)
                .WithMany(u => u.WorkoutSessions)
                .HasForeignKey(s => s.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // Plan deleted -> the history stays, WorkoutPlanID becomes NULL
            builder.HasOne(s => s.WorkoutPlan)
                .WithMany(p => p.WorkoutSessions)
                .HasForeignKey(s => s.WorkoutPlanID)
                .OnDelete(DeleteBehavior.SetNull);

            // "My workouts, newest first" is the most common query
            builder.HasIndex(s => new { s.UserID, s.StartedAt });
        }
    }
}
