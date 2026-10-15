using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class WorkoutPlanConfiguration : IEntityTypeConfiguration<WorkoutPlan>
    {
        public void Configure(EntityTypeBuilder<WorkoutPlan> builder)
        {
            builder.ToTable("WorkoutPlans");
            
          
            builder.HasKey(W => W.WorkoutPlanID);

            builder.Property(w => w.WorkoutPlanName)
                .IsRequired();


            builder.Property(w => w.WorkoutPlanDescription)
                .IsRequired();
               

            builder.Property(w => w.UserID)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(w => w.CreatedAt)
                .IsRequired();

           

            builder.HasOne(u => u.User)
                .WithMany(w => w.WorkoutPlans)
                .HasForeignKey(u => u.UserID);

            builder.HasMany(w => w.WorkoutExercises)
                .WithOne(w => w.WorkoutPlan)
                .HasForeignKey(w => w.WorkoutPlanID);




        }
    }
}
