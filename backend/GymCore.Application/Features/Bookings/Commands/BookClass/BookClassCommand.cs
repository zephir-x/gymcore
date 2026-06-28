using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Commands.BookClass
{
    public record BookClassResult(Guid ReservationId, ReservationStatus Status);

    public record BookClassCommand(Guid ClassId, Guid UserId) : IRequest<BookClassResult>;

    public class BookClassCommandHandler(IApplicationDbContext context) : IRequestHandler<BookClassCommand, BookClassResult>
    {
        public async Task<BookClassResult> Handle(BookClassCommand request, CancellationToken cancellationToken)
        {
            var groupClass = await context.GroupClasses
                .Include(c => c.Reservations)
                .FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

            if (groupClass == null) throw new Exception("Group class not found.");

            var activeSubscription = await context.UserSubscriptions
                .Include(s => s.Tier)
                .Where(s => s.UserId == request.UserId && s.EndDate >= DateTime.UtcNow && s.Status == SubscriptionStatus.Active)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeSubscription == null) throw new Exception("You need an active subscription to book a class.");
            
            var tierName = activeSubscription.Tier.Name.ToUpper();
            if (tierName != "PRO" && tierName != "VIP") throw new Exception("Group classes require a PRO or VIP membership.");

            // Waitlist logic
            var currentBookingsCount = groupClass.Reservations.Count(r => r.Status == ReservationStatus.Confirmed);
            var isFull = currentBookingsCount >= groupClass.MaxAttendees;
            var targetStatus = isFull ? ReservationStatus.Waitlist : ReservationStatus.Confirmed;

            var existingReservation = groupClass.Reservations.FirstOrDefault(r => r.UserId == request.UserId);

            if (existingReservation != null)
            {
                if (existingReservation.Status != ReservationStatus.Cancelled)
                    throw new Exception("You are already booked or waitlisted for this class.");
                
                existingReservation.Reactivate(targetStatus);
            }
            else
            {
                existingReservation = new ClassReservation(request.UserId, request.ClassId, targetStatus);
                context.ClassReservations.Add(existingReservation);
            }

            try
            {
                await context.SaveChangesAsync(cancellationToken);
                
                // We return the result with status
                return new BookClassResult(existingReservation.Id, targetStatus);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new Exception("Someone else just took the last spot! Please refresh and try again.");
            }
        }
    }
}