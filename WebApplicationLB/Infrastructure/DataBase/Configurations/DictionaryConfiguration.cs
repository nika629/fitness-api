using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplicationLB.Domain.Entities;

namespace WebApplicationLB.Infrastructure.DataBase.Configurations
{
    internal class DictionaryConfiguration : IEntityTypeConfiguration<Dictionary>
    {
        #region Methods
        public void Configure(EntityTypeBuilder<Dictionary> builder)
        {
            builder.ToTable("Dictionaries");

            builder.HasKey(item => item.DictionaryID);

            builder.Property(item => item.DictionaryCaption)
                .IsRequired();

            builder.HasOne(d => d.Parent)
                .WithMany(d => d.Children)
                .HasForeignKey(d => d.DictionaryParentID);

            builder.HasMany(d => d.UsersRoles)
                .WithOne(u => u.DictionaryRole)
                .HasForeignKey(u => u.UserDictionaryRoleID);

            builder.HasMany(d => d.ExercisesEquipments)
                .WithOne(e => e.DictionaryEquipment)
                .HasForeignKey(e => e.EquipmentDictionaryID);

            builder.HasMany(d => d.ExercisesMuscleGroups)
                .WithOne(e => e.DictionaryMuscleGroup)
                .HasForeignKey(e => e.MuscleGroupDictionaryID);
        }
        #endregion
    }
}