using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class FavoriteExerciseConfiguration : IEntityTypeConfiguration<FavoriteExercise>
    {
        public void Configure(EntityTypeBuilder<FavoriteExercise> builder)
        {
            builder.ToTable("FavortiteExercises");

            builder.HasKey(f => new { f.UserID, f.ExerciseID});

            builder.Property(u => u.UserID)
                .IsRequired();

            builder.Property(e => e.ExerciseID)
                .IsRequired();

            
            builder.HasOne(f => f.User)
                .WithMany(u => u.FavoriteExercises)
                .HasForeignKey(f => f.UserID);

            builder.HasOne(f => f.Exercise)
                .WithMany(e => e.FavoriteExercises)
                .HasForeignKey(f => f.ExerciseID);
        }
    }
}