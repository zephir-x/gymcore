using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Subscriptions.Queries.GetSubscriptionTiers
{
    public record GetSubscriptionTiersQuery() : IRequest<List<SubscriptionTierDto>>;

    public class GetSubscriptionTiersQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetSubscriptionTiersQuery, List<SubscriptionTierDto>>
    {
        public async Task<List<SubscriptionTierDto>> Handle(GetSubscriptionTiersQuery request, CancellationToken cancellationToken)
        {
            return await context.SubscriptionTiers
                .AsNoTracking()
                .Select(t => new SubscriptionTierDto(t.Id, t.Name, t.MonthlyPrice))
                .ToListAsync(cancellationToken);
        }
    }
}