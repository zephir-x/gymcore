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
            var tier = await context.SubscriptionTiers.FindAsync([request.TierId], cancellationToken);
            if (tier == null)
                throw new Exception("Subscription tier not found.");

            // Instead of throwing an error, get your current subscription
            var activeSubscription = await context.UserSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            // If you have an active subscription, cancel it (Upgrade/Overwrite)
            if (activeSubscription != null)
            {
                activeSubscription.Cancel();
            }

            // We create and assign a new one
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