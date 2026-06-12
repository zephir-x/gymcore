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
            // We download classes along with room details (to know the seating limit) and current reservations
            var groupClass = await context.GroupClasses
                .Include(c => c.Room)
                .Include(c => c.Reservations)
                .FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

            if (groupClass == null)
                throw new Exception("Group class not found.");

            // Has the user already signed up?
            if (groupClass.Reservations.Any(r => r.UserId == request.UserId && r.Status != ReservationStatus.Cancelled))
                throw new Exception("You are already booked for this class.");

            // Are there any seats available?
            var currentBookingsCount = groupClass.Reservations.Count(r => r.Status == ReservationStatus.Confirmed);
            // Let's say our Room entity has a Capacity field - if you have it in GroupClass, change it accordingly
            if (currentBookingsCount >= groupClass.MaxAttendees) 
            {
                // We will add Waitlist logic here in the future
                throw new Exception("This class is fully booked.");
            }

            // We are making a reservation
            var reservation = new ClassReservation(request.UserId, request.ClassId);
            context.ClassReservations.Add(reservation);

            // Save with optimistic locking
            try
            {
                await context.SaveChangesAsync(cancellationToken);
                return reservation.Id;
            }
            catch (DbUpdateConcurrencyException)
            {
                // If 2 people clicked at once with 1 free spot, the database will reject the second request
                throw new Exception("Someone else just took the last spot! Please refresh and try again.");
            }
        }
    }
}