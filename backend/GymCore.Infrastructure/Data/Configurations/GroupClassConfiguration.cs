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
            
            // EF Core will automatically update this field on every save
            // If two users try to save a change based on the same version, the second one will get an error (DbUpdateConcurrencyException)
            builder.Property<uint>("Version").IsRowVersion();
            
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name).IsRequired().HasMaxLength(150);

            builder.HasOne(x => x.Coach)
                .WithMany()
                .HasForeignKey(x => x.CoachId)
                .OnDelete(DeleteBehavior.Restrict); // We prohibit removing a trainer if he or she has assigned classes

            builder.HasOne(x => x.Room)
                .WithMany()
                .HasForeignKey(x => x.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Report for reservation
            builder.HasMany(x => x.Reservations)
                .WithOne(r => r.GroupClass)
                .HasForeignKey(r => r.GroupClassId) 
                .OnDelete(DeleteBehavior.Restrict); 

            // We tell EF Core to save reservations directly to the private _reservations field
            builder.Navigation(x => x.Reservations).UsePropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}