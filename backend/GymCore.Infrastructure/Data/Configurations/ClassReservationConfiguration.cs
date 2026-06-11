using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class ClassReservationConfiguration : IEntityTypeConfiguration<ClassReservation>
    {
        public void Configure(EntityTypeBuilder<ClassReservation> builder)
        {
            builder.ToTable("ClassReservations");
            builder.HasKey(x => x.Id);

            // Database-level security:
            // One user can only have one reservation for the same specific activity
            builder.HasIndex(x => new { x.UserId, x.GroupClassId }).IsUnique();

            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.GroupClass)
                .WithMany()
                .HasForeignKey(x => x.GroupClassId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}