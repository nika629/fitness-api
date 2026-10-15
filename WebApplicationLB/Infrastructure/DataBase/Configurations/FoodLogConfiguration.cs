using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class FoodLogConfiguration : IEntityTypeConfiguration<FoodLog>
    {
        public void Configure(EntityTypeBuilder<FoodLog> builder)
        {
            builder.ToTable("FoodLogs");

            builder.HasKey(u => u.FoodLogID);

            builder.Property(u => u.FoodName)
                .IsRequired();

            builder.Property(u => u.Calories)
                .IsRequired();

            builder.Property(u => u.Protein)
                .IsRequired();

            builder.Property(u => u.Carbohydrates)
                .IsRequired();

            builder.Property(u => u.Fat)
                .IsRequired();

            builder.HasOne(u => u.User)
                .WithMany(u => u.FoodLogs)
                .HasForeignKey(u => u.UserID)
                .OnDelete(DeleteBehavior.Cascade);


        }
    }
}
