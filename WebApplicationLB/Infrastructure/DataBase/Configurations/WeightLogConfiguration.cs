using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class WeightLogConfiguration : IEntityTypeConfiguration<WeightLog>
    {
        public void Configure(EntityTypeBuilder<WeightLog> builder)
        {
            builder.ToTable("WeightLogs");

            builder.HasKey(w => w.WeightLogID);

            builder.Property(w => w.Weight).IsRequired();
            builder.Property(w => w.LoggedAt).IsRequired();

            builder.HasOne(w => w.User)
                .WithMany(u => u.WeightLogs)
                .HasForeignKey(w => w.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(w => new { w.UserID, w.LoggedAt });
        }
    }
}
