using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Commands.CancelReservation
{
    // The command accepts the reservation ID and user ID (so no one cancels someone else's class)
    public record CancelReservationCommand(Guid ReservationId, Guid UserId) : IRequest;

    public class CancelReservationCommandHandler(IApplicationDbContext context)
        : IRequestHandler<CancelReservationCommand>
    {
        public async Task Handle(CancelReservationCommand request, CancellationToken cancellationToken)
        {
            var reservation = await context.ClassReservations
                .FirstOrDefaultAsync(r => r.Id == request.ReservationId, cancellationToken);

            if (reservation == null)
                throw new Exception("Reservation not found.");
            
            if (reservation.UserId != request.UserId)
                throw new Exception("You are not authorized to cancel this reservation.");

            reservation.Cancel();

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}