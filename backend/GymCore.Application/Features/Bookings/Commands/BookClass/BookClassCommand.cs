using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Commands.BookClass
{
    // The command accepts a class ID - we'll extract the user ID from their JWT token in the controller
    public record BookClassCommand(Guid ClassId, Guid UserId) : IRequest<Guid>;

    public class BookClassCommandHandler(IApplicationDbContext context) : IRequestHandler<BookClassCommand, Guid>
    {
        public async Task<Guid> Handle(BookClassCommand request, CancellationToken cancellationToken)
        {
            var groupClass = await context.GroupClasses
                .Include(c => c.Room)
                .Include(c => c.Reservations)
                .FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

            if (groupClass == null)
                throw new Exception("Group class not found.");

            // Does the user have an active pass?
            var hasActiveSubscription = await context.UserSubscriptions
                .AnyAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            if (!hasActiveSubscription)
                throw new Exception("You must have an active subscription to book a class.");
            
            // Are there any seats available?
            var currentBookingsCount = groupClass.Reservations.Count(r => r.Status == ReservationStatus.Confirmed);
            if (currentBookingsCount >= groupClass.MaxAttendees) 
                throw new Exception("This class is fully booked.");

            // We check if the user already has a reservation (even a canceled one)
            var existingReservation = groupClass.Reservations.FirstOrDefault(r => r.UserId == request.UserId);

            if (existingReservation != null)
            {
                // If it is not canceled, it means it is already saved
                if (existingReservation.Status != ReservationStatus.Cancelled)
                    throw new Exception("You are already booked for this class.");
                
                // If it was canceled, we will reactivate it
                existingReservation.Reactivate();
            }
            else
            {
                // Only if you have never participated before, we create a completely new
                existingReservation = new ClassReservation(request.UserId, request.ClassId);
                context.ClassReservations.Add(existingReservation);
            }

            // Save with optimistic locking
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