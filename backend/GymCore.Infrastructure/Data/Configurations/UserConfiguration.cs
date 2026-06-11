using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymCore.Infrastructure.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            // Table name
            builder.ToTable("Users");

            // Primary key
            builder.HasKey(u => u.Id);

            // Properties
            builder.Property(u => u.Email).IsRequired().HasMaxLength(255);

            builder.Property(u => u.PasswordHash).IsRequired();

            // Unique Email at the database level (duplicate protection)
            builder.HasIndex(u => u.Email).IsUnique();

            // 1-to-1 relationship: User has one UserDetails
            builder.HasOne(u => u.Details)
                .WithOne(d => d.User)
                .HasForeignKey<UserDetails>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade); // If we delete a user, his details disappear
        }
    }
}