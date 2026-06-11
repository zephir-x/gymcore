using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class GroupClassConfiguration : IEntityTypeConfiguration<GroupClass>
    {
        public void Configure(EntityTypeBuilder<GroupClass> builder)
        {
            builder.ToTable("GroupClasses");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
            
            // EF Core will automatically update this field on every save
            // If two users try to save a change based on the same version, the second one will get an error (DbUpdateConcurrencyException)
            builder.Property(x => x.RowVersion).IsRowVersion();

            builder.HasOne(x => x.Coach)
                .WithMany()
                .HasForeignKey(x => x.CoachId)
                .OnDelete(DeleteBehavior.Restrict); // We prohibit removing a trainer if he or she has assigned classes

            builder.HasOne(x => x.Room)
                .WithMany()
                .HasForeignKey(x => x.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}