using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using GymCore.Application.Common.Interfaces;

namespace GymCore.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Registering our tables (DbSets)
        public DbSet<User> Users { get; set; }
        public DbSet<UserDetails> UserDetails { get; set; }
        public DbSet<SubscriptionTier> SubscriptionTiers { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<GroupClass> GroupClasses { get; set; }
        public DbSet<ClassReservation> ClassReservations { get; set; }
        public DbSet<TrainerSlot> TrainerSlots { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Automatically scans this project and applies all Fluent API configurations
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}