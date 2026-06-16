using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetCoaches
{
    public record CoachDto(Guid Id, string FirstName, string LastName);

    public record GetCoachesQuery() : IRequest<List<CoachDto>>;

    public class GetCoachesQueryHandler(IApplicationDbContext context) : IRequestHandler<GetCoachesQuery, List<CoachDto>>
    {
        public async Task<List<CoachDto>> Handle(GetCoachesQuery request, CancellationToken cancellationToken)
        {
            // We fetch all users with the Coach role and attach their UserDetails
            return await context.Users
                .AsNoTracking()
                .Include(u => u.Details)
                .Where(u => u.Role == UserRole.Coach)
                .Select(u => new CoachDto(u.Id, u.Details.FirstName, u.Details.LastName))
                .ToListAsync(cancellationToken);
        }
    }
}