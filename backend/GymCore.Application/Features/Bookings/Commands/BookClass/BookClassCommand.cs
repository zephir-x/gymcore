using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Commands.BookClass
{
    public record BookClassCommand(Guid ClassId, Guid UserId) : IRequest<Guid>;

    public class BookClassCommandHandler(IApplicationDbContext context) : IRequestHandler<BookClassCommand, Guid>
    {
        public async Task<Guid> Handle(BookClassCommand request, CancellationToken cancellationToken)
        {
            var groupClass = await context.GroupClasses
                .Include(c => c.Reservations)
                .FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

            if (groupClass == null)
                throw new Exception("Group class not found.");

            // We download the active subscription and its package
            var activeSubscription = await context.UserSubscriptions
                .Include(s => s.Tier)
                .Where(s => s.UserId == request.UserId && s.EndDate >= DateTime.UtcNow && s.Status == SubscriptionStatus.Active)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeSubscription == null)
                throw new Exception("You need an active subscription to book a class.");
            
            // We check if it is PRO or VIP
            var tierName = activeSubscription.Tier.Name.ToUpper();
            if (tierName != "PRO" && tierName != "VIP")
            {
                throw new Exception("Group classes require a PRO or VIP membership.");
            }

            var currentBookingsCount = groupClass.Reservations.Count(r => r.Status == ReservationStatus.Confirmed);
            if (currentBookingsCount >= groupClass.MaxAttendees) 
                throw new Exception("This class is fully booked.");

            var existingReservation = groupClass.Reservations.FirstOrDefault(r => r.UserId == request.UserId);

            if (existingReservation != null)
            {
                if (existingReservation.Status != ReservationStatus.Cancelled)
                    throw new Exception("You are already booked for this class.");
                
                existingReservation.Reactivate();
            }
            else
            {
                existingReservation = new ClassReservation(request.UserId, request.ClassId);
                context.ClassReservations.Add(existingReservation);
            }

            try
            {
                await context.SaveChangesAsync(cancellationToken);
                return existingReservation.Id;
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new Exception("Someone else just took the last spot! Please refresh and try again.");
            }
        }
    }
}