using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetCoaches
{
    public record CoachDto(Guid Id, string FirstName, string LastName, string? AvatarUrl);

    public record GetCoachesQuery() : IRequest<List<CoachDto>>;

    public class GetCoachesQueryHandler(IApplicationDbContext context) : IRequestHandler<GetCoachesQuery, List<CoachDto>>
    {
        public async Task<List<CoachDto>> Handle(GetCoachesQuery request, CancellationToken cancellationToken)
        {
            return await context.Users
                .AsNoTracking()
                .Include(u => u.Details)
                .Where(u => u.Role == UserRole.Coach)
                .Select(u => new CoachDto(u.Id, u.Details.FirstName, u.Details.LastName, u.Details.AvatarUrl))
                .ToListAsync(cancellationToken);
        }
    }
}