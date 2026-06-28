using GymCore.Application.Common.Interfaces;
using MediatR;
using GymCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Coaches.Commands.CancelTrainerSlot
{
    public record CancelTrainerSlotCommand(Guid SlotId, Guid CoachId) : IRequest;

    public class CancelTrainerSlotCommandHandler(IApplicationDbContext context) : IRequestHandler<CancelTrainerSlotCommand>
    {
        public async Task Handle(CancelTrainerSlotCommand request, CancellationToken cancellationToken)
        {
            var slot = await context.TrainerSlots
                .FirstOrDefaultAsync(s => s.Id == request.SlotId, cancellationToken);

            if (slot == null)
                throw new Exception("Trainer slot not found.");

            if (slot.CoachId != request.CoachId)
                throw new Exception("You are not authorized to cancel this slot.");

            // We use our domain method which changes the status to Cancelled
            slot.Cancel();

            if (slot.ClientId.HasValue)
            {
                var notification = new Notification(
                    slot.ClientId.Value,
                    "1:1 Session Cancelled",
                    $"Unfortunately, your personal training session scheduled for {slot.StartTime:MMM dd, yyyy HH:mm} has been cancelled by the trainer."
                );
                context.Notifications.Add(notification);
            }
            
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}