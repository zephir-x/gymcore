using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace GymCore.Application.Features.Bookings.Queries.GetAvailableClasses
{
    public record GroupClassDto(Guid Id, string Name, string CoachName, DateTime StartTime, DateTime EndTime, int MaxAttendees, int CurrentBookings, int WaitlistCount, string? ImageUrl);
    
    public record GetAvailableClassesQuery() : IRequest<List<GroupClassDto>>;

    public class GetAvailableClassesQueryHandler(IApplicationDbContext context) : IRequestHandler<GetAvailableClassesQuery, List<GroupClassDto>>
    {
        public async Task<List<GroupClassDto>> Handle(GetAvailableClassesQuery request, CancellationToken cancellationToken)
        {
            return await context.GroupClasses
                .AsNoTracking()
                .Include(c => c.Coach)
                .ThenInclude(c => c.Details)
                .Where(c => c.StartTime >= DateTime.UtcNow && !c.IsCancelled)
                .OrderBy(c => c.StartTime)
                .Select(c => new GroupClassDto(
                    c.Id, 
                    c.Name, 
                    c.Coach != null && c.Coach.Details != null 
                        ? c.Coach.Details.FirstName + " " + c.Coach.Details.LastName 
                        : "To be announced", 
                    c.StartTime, 
                    c.EndTime, 
                    c.MaxAttendees,
                    c.Reservations.Count(r => r.Status == ReservationStatus.Confirmed),
                    c.Reservations.Count(r => r.Status == ReservationStatus.Waitlist),
                    c.ImageUrl
                ))
                .ToListAsync(cancellationToken);
        }
    }
}