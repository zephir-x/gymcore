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
            // First, we check if this is a reservation for a group class
            var classReservation = await context.ClassReservations
                .FirstOrDefaultAsync(r => r.Id == request.ReservationId, cancellationToken);

            if (classReservation != null)
            {
                if (classReservation.UserId != request.UserId)
                    throw new Exception("You are not authorized to cancel this reservation.");

                classReservation.Cancel();
                await context.SaveChangesAsync(cancellationToken);
                return; // Finish successfully
            }

            // If not group, we check if it is personal training (Slot)
            var trainerSlot = await context.TrainerSlots
                .FirstOrDefaultAsync(s => s.Id == request.ReservationId, cancellationToken);

            if (trainerSlot != null)
            {
                if (trainerSlot.ClientId != request.UserId)
                    throw new Exception("You are not authorized to cancel this session.");

                trainerSlot.Release();
                await context.SaveChangesAsync(cancellationToken);
                return;
            }

            // If didn't find it anywhere
            throw new Exception("Reservation not found.");
        }
    }
}