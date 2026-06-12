using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Commands.BookTrainerSlot
{
    public record BookTrainerSlotCommand(Guid SlotId, Guid UserId) : IRequest;

    public class BookTrainerSlotCommandHandler(IApplicationDbContext context) : IRequestHandler<BookTrainerSlotCommand>
    {
        public async Task Handle(BookTrainerSlotCommand request, CancellationToken cancellationToken)
        {
            // Does the user have an active pass?
            var hasActiveSubscription = await context.UserSubscriptions
                .AnyAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            if (!hasActiveSubscription)
                throw new Exception("You must have an active subscription to book a personal training.");

            // We download the trainer window
            var slot = await context.TrainerSlots
                .FirstOrDefaultAsync(s => s.Id == request.SlotId, cancellationToken);

            if (slot == null)
                throw new Exception("Trainer slot not found.");

            // We reserve (our domain method will throw an error if the slot is already occupied)
            slot.Book(request.UserId);

            // Optimistic Concurrency Lock Write
            try
            {
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new Exception("Someone else just booked this slot! Please refresh and choose another time.");
            }
        }
    }
}