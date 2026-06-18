using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Queries.GetDashboardStats
{
    // DTO for a single "slice" of a pie chart
    public record SubscriptionDistributionDto(string TierName, int Count);

    // DTO of the entire Dashboard
    public record DashboardStatsDto(
        int TotalMembers, 
        int TotalStaff, 
        decimal MonthlyRevenue, 
        List<SubscriptionDistributionDto> Distribution);

    public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;

    public class GetDashboardStatsQueryHandler(IApplicationDbContext context) 
        : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
    {
        public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
        {
            // We calculate the base KPIs
            var totalMembers = await context.Users.CountAsync(u => u.Role == UserRole.Member && u.IsActive, cancellationToken);
            var totalStaff = await context.Users.CountAsync(u => u.Role == UserRole.Coach && u.IsActive, cancellationToken);

            // We download all active subscriptions along with their price lists
            var activeSubs = await context.UserSubscriptions
                .Include(s => s.Tier)
                .AsNoTracking()
                .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate >= DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            // We calculate Monthly Recurring Revenue
            var monthlyRevenue = activeSubs.Sum(s => s.Tier.MonthlyPrice);

            // Grouping for Pie Chart (How many people have Basic, Pro, VIP)
            var distribution = activeSubs
                .GroupBy(s => s.Tier.Name)
                .Select(g => new SubscriptionDistributionDto(g.Key, g.Count()))
                .ToList();

            // We enumerate the "Without Sub" group
            // We extract the unique ID of users who have an active pass
            var usersWithActiveSubCount = activeSubs.Select(s => s.UserId).Distinct().Count();
            var withoutSubCount = totalMembers - usersWithActiveSubCount;

            if (withoutSubCount > 0)
            {
                distribution.Add(new SubscriptionDistributionDto("Without Sub", withoutSubCount));
            }

            return new DashboardStatsDto(totalMembers, totalStaff, monthlyRevenue, distribution);
        }
    }
}