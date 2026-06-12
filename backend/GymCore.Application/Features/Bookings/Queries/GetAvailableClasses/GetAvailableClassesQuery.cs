using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetAvailableClasses
{
    // Query does not accept parameters (we may add date filters in the future)
    public record GetAvailableClassesQuery() : IRequest<List<GroupClassDto>>;

    public class GetAvailableClassesQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetAvailableClassesQuery, List<GroupClassDto>>
    {
        public async Task<List<GroupClassDto>> Handle(GetAvailableClassesQuery request, CancellationToken cancellationToken)
        {
            return await context.GroupClasses
                .AsNoTracking() // We don't track changes on read
                .Where(c => c.StartTime >= DateTime.UtcNow) // We only draw future classes
                .OrderBy(c => c.StartTime)
                .Select(c => new GroupClassDto(
                    c.Id,
                    c.Name,
                    c.StartTime,
                    c.EndTime,
                    c.MaxAttendees,
                    c.Reservations.Count(r => r.Status == ReservationStatus.Confirmed)
                ))
                .ToListAsync(cancellationToken);
        }
    }
}