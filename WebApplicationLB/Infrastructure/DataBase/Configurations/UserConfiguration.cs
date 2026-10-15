using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(i => i.UserID);

            builder.Property(i => i.UserName).IsRequired();
            builder.Property(i => i.UserLastName).IsRequired();
            builder.Property(i => i.UserEmail).IsRequired();
            builder.Property(i => i.UserPasswordHash).IsRequired();
            
            builder.HasMany(u => u.WorkoutPlans)
                .WithOne(u => u.User)
                .HasForeignKey(w => w.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(f => f.FavoriteExercises)
                .WithOne(f => f.User)
                .HasForeignKey(f => f.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(f => f.FoodLogs)
                .WithOne(f => f.User)
                .HasForeignKey(f => f.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(u => u.DictionaryRole)
                .WithMany(d => d.UsersRoles)
                .HasForeignKey(u => u.UserDictionaryRoleID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}