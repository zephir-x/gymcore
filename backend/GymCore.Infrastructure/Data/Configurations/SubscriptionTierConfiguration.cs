using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class SubscriptionTierConfiguration : IEntityTypeConfiguration<SubscriptionTier>
    {
        public void Configure(EntityTypeBuilder<SubscriptionTier> builder)
        {
            builder.ToTable("SubscriptionTiers");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
            builder.Property(x => x.MonthlyPrice).HasColumnType("decimal(18,2)");
        }
    }
}