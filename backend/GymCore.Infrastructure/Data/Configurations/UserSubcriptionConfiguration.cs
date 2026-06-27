using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class UserSubscriptionConfiguration : IEntityTypeConfiguration<UserSubscription>
    {
        public void Configure(EntityTypeBuilder<UserSubscription> builder)
        {
            builder.ToTable("UserSubscriptions");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Tier)
                .WithMany()
                .HasForeignKey(x => x.TierId)
                .OnDelete(DeleteBehavior.Restrict); // You cannot remove a package from the database if someone has purchased it
            
            builder.Property(x => x.PaymentIntentId)
                .IsRequired(false);
        }
    }
}