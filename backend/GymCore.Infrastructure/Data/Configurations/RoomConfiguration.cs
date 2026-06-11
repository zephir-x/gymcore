using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class RoomConfiguration : IEntityTypeConfiguration<Room>
    {
        public void Configure(EntityTypeBuilder<Room> builder)
        {
            builder.ToTable("Rooms");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name).IsRequired().HasMaxLength(100);

            // Optional coverage: Room may require a specific package
            builder.HasOne(x => x.RequiredTier)
                .WithMany()
                .HasForeignKey(x => x.RequiredTierId)
                .OnDelete(DeleteBehavior.SetNull); // If we remove the package from the database, the room becomes open to everyone
        }
    }
}