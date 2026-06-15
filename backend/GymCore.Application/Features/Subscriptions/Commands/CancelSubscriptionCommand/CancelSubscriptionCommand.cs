using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Subscriptions.Commands.CancelSubscription
{
    public record CancelSubscriptionCommand(Guid UserId) : IRequest;

    public class CancelSubscriptionCommandHandler(IApplicationDbContext context)
        : IRequestHandler<CancelSubscriptionCommand>
    {
        public async Task Handle(CancelSubscriptionCommand request, CancellationToken cancellationToken)
        {
            // Find user's currently active subscription
            var activeSubscription = await context.UserSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            if (activeSubscription == null)
                throw new Exception("You do not have any active subscription to cancel.");

            // Soft-cancel: change status to Cancelled, keep the record in DB
            activeSubscription.Cancel();

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}