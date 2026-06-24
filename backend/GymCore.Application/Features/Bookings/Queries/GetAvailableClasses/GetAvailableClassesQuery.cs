using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetAvailableClasses
{
    public record GroupClassDto(Guid Id, string Name, DateTime StartTime, DateTime EndTime, int MaxAttendees, int CurrentBookings, string? ImageUrl);
    
    public record GetAvailableClassesQuery() : IRequest<List<GroupClassDto>>;

    public class GetAvailableClassesQueryHandler(IApplicationDbContext context) : IRequestHandler<GetAvailableClassesQuery, List<GroupClassDto>>
    {
        public async Task<List<GroupClassDto>> Handle(GetAvailableClassesQuery request, CancellationToken cancellationToken)
        {
            return await context.GroupClasses
                .AsNoTracking()
                .Where(c => c.StartTime >= DateTime.UtcNow && !c.IsCancelled)
                .OrderBy(c => c.StartTime)
                .Select(c => new GroupClassDto(
                    c.Id, c.Name, c.StartTime, c.EndTime, c.MaxAttendees,
                    c.Reservations.Count(r => r.Status == ReservationStatus.Confirmed),
                    c.ImageUrl
                ))
                .ToListAsync(cancellationToken);
        }
    }
}