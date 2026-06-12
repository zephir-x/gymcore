using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Subscriptions.Queries.GetMySubscription
{
    // We return a DTO, but it may be nullable (if the user does not have a subscription)
    public record GetMySubscriptionQuery(Guid UserId) : IRequest<MySubscriptionDto?>;

    public class GetMySubscriptionQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetMySubscriptionQuery, MySubscriptionDto?>
    {
        public async Task<MySubscriptionDto?> Handle(GetMySubscriptionQuery request, CancellationToken cancellationToken)
        {
            var subscription = await context.UserSubscriptions
                .AsNoTracking()
                .Include(s => s.Tier)
                .Where(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (subscription == null) return null;

            return new MySubscriptionDto(
                subscription.Id,
                subscription.Tier.Name,
                subscription.StartDate,
                subscription.EndDate,
                subscription.Status.ToString()
            );
        }
    }
}