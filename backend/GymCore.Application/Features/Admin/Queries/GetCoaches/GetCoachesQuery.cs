using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Queries.GetCoaches
{
    public record CoachDto(Guid Id, string FirstName, string LastName);
    public record GetCoachesQuery() : IRequest<List<CoachDto>>;

    public class GetCoachesQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetCoachesQuery, List<CoachDto>>
    {
        public async Task<List<CoachDto>> Handle(GetCoachesQuery request, CancellationToken cancellationToken)
        {
            // We join the Users and UserDetails tables to extract the name and surname only for the Coach role
            return await context.UserDetails.AsNoTracking()
                .Where(ud => context.Users.Any(u => u.Id == ud.UserId && u.Role == UserRole.Coach))
                .Select(ud => new CoachDto(ud.UserId, ud.FirstName, ud.LastName))
                .ToListAsync(cancellationToken);
        }
    }
}