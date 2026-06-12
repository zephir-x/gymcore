using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class TrainerSlotConfiguration : IEntityTypeConfiguration<TrainerSlot>
    {
        public void Configure(EntityTypeBuilder<TrainerSlot> builder)
        {
            builder.ToTable("TrainerSlots");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.Coach)
                .WithMany()
                .HasForeignKey(x => x.CoachId)
                .OnDelete(DeleteBehavior.Restrict);

            // Client relationship is optional (ClientId can be null)
            builder.HasOne(x => x.Client)
                .WithMany()
                .HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.SetNull); // If we remove the client, the slot remains but goes back to being empty
            
            // Optimistic concurrency lock
            builder.Property<uint>("Version").IsRowVersion();
        }
    }
}