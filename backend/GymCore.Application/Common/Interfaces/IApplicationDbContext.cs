using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<UserDetails> UserDetails { get; }
        DbSet<SubscriptionTier> SubscriptionTiers { get; }
        DbSet<UserSubscription> UserSubscriptions { get; }
        DbSet<Room> Rooms { get; }
        DbSet<GroupClass> GroupClasses { get; }
        DbSet<ClassReservation> ClassReservations { get; }
        DbSet<TrainerSlot> TrainerSlots { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}