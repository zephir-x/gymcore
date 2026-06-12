using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetUserReservations
{
    // The query requires the UserId (which we will safely extract from the JWT token)
    public record GetUserReservationsQuery(Guid UserId) : IRequest<List<UserReservationDto>>;

    public class GetUserReservationsQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetUserReservationsQuery, List<UserReservationDto>>
    {
        public async Task<List<UserReservationDto>> Handle(GetUserReservationsQuery request, CancellationToken cancellationToken)
        {
            return await context.ClassReservations
                .AsNoTracking()
                .Where(r => r.UserId == request.UserId)
                .Include(r => r.GroupClass) // We need to include the class details to show its name and time
                .OrderBy(r => r.GroupClass.StartTime)
                .Select(r => new UserReservationDto(
                    r.Id,
                    r.GroupClass.Id,
                    r.GroupClass.Name,
                    r.GroupClass.StartTime,
                    r.GroupClass.EndTime,
                    r.Status.ToString() // Convert enum to string for the frontend
                ))
                .ToListAsync(cancellationToken);
        }
    }
}