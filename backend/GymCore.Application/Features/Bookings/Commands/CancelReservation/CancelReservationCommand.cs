using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
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

                // Auto-promote from waitlist
                var groupClass = await context.GroupClasses
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Id == classReservation.GroupClassId, cancellationToken);

                if (groupClass != null)
                {
                    var confirmedCount = groupClass.Reservations.Count(r => r.Status == ReservationStatus.Confirmed);
        
                    // If a spot has become available and we have someone on the waiting list
                    if (confirmedCount < groupClass.MaxAttendees)
                    {
                        var nextInLine = groupClass.Reservations
                            .Where(r => r.Status == ReservationStatus.Waitlist)
                            .OrderBy(r => r.CreatedAt) // First come first served
                            .FirstOrDefault();

                        if (nextInLine != null)
                        {
                            nextInLine.PromoteFromWaitlist();
            
                            // We are sending a notification to member
                            var notification = new Notification(
                                nextInLine.UserId,
                                "Waitlist Update: Spot Secured!",
                                $"A spot opened up for {groupClass.Name} and you have been automatically moved from the waitlist to the confirmed list."
                            );
                            context.Notifications.Add(notification);
                        }
                    }
                }

                await context.SaveChangesAsync(cancellationToken);
                return;
            }

            // If not group, we check if it is personal training (Slot)
            var trainerSlot = await context.TrainerSlots
                .FirstOrDefaultAsync(s => s.Id == request.ReservationId, cancellationToken);

            if (trainerSlot != null)
            {
                if (trainerSlot.ClientId != request.UserId)
                    throw new Exception("You are not authorized to cancel this session.");

                trainerSlot.Release();
                
                // We are sending a notification to coach
                var notification = new GymCore.Domain.Entities.Notification(
                    trainerSlot.CoachId,
                    "1:1 Session Cancelled",
                    $"A client has just cancelled their personal training session on {trainerSlot.StartTime:MMM dd, yyyy HH:mm}. The slot is now open for booking again."
                );
                context.Notifications.Add(notification);
                
                await context.SaveChangesAsync(cancellationToken);
                return;
            }

            // If didn't find it anywhere
            throw new Exception("Reservation not found.");
        }
    }
}