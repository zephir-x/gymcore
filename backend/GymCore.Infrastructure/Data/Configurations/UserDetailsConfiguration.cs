using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class UserDetailsConfiguration : IEntityTypeConfiguration<UserDetails>
    {
        public void Configure(EntityTypeBuilder<UserDetails> builder)
        {
            builder.ToTable("UserDetails");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.FirstName).IsRequired().HasMaxLength(100);
            builder.Property(x => x.LastName).IsRequired().HasMaxLength(100);
            builder.Property(x => x.AvatarUrl).HasMaxLength(500);
            builder.Property(x => x.Bio).HasMaxLength(1000);

            // Set the column type for decimal values (e.g. 999.99)
            builder.Property(x => x.Weight).HasColumnType("decimal(5,2)");
            builder.Property(x => x.Height).HasColumnType("decimal(5,2)");
        }
    }
}