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
            var activeSubscription = await context.UserSubscriptions
                .Include(s => s.Tier)
                .Where(s => s.UserId == request.UserId && s.EndDate >= DateTime.UtcNow && s.Status == SubscriptionStatus.Active)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeSubscription == null)
                throw new Exception("You need an active subscription to book a personal training.");

            // We check if it's a VIP
            var tierName = activeSubscription.Tier.Name.ToUpper();
            if (tierName != "VIP")
            {
                throw new Exception("Personal 1:1 training requires a VIP membership.");
            }

            var slot = await context.TrainerSlots
                .FirstOrDefaultAsync(s => s.Id == request.SlotId, cancellationToken);

            if (slot == null)
                throw new Exception("Trainer slot not found.");

            slot.Book(request.UserId);

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