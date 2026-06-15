using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Subscriptions.Commands.BuySubscription
{
    // Command takes the User ID (from JWT) and the chosen Tier ID
    public record BuySubscriptionCommand(Guid UserId, Guid TierId, int Months) : IRequest<Guid>;

    public class BuySubscriptionCommandHandler(IApplicationDbContext context)
        : IRequestHandler<BuySubscriptionCommand, Guid>
    {
        public async Task<Guid> Handle(BuySubscriptionCommand request, CancellationToken cancellationToken)
        {
            // Check if the tier exists
            var tier = await context.SubscriptionTiers.FindAsync([request.TierId], cancellationToken);
            if (tier == null)
                throw new Exception("Subscription tier not found.");

            // Check if the user already has an active subscription
            var hasActiveSubscription = await context.UserSubscriptions
                .AnyAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            if (hasActiveSubscription)
                throw new Exception("You already have an active subscription.");

            // Create the subscription (Calculate exact EndDate based on requested months)
            // Here we assume payment was successful. In a real system, status would be 'PendingPayment'.
            var subscription = new UserSubscription(
                request.UserId, 
                request.TierId, 
                DateTime.UtcNow, 
                DateTime.UtcNow.AddMonths(request.Months));

            context.UserSubscriptions.Add(subscription);
            await context.SaveChangesAsync(cancellationToken);

            return subscription.Id;
        }
    }
}