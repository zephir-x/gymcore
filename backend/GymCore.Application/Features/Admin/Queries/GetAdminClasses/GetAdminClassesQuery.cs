using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Queries.GetAdminClasses
{
    public record AdminClassDto(
        Guid Id, 
        string Name, 
        string CoachName, 
        string RoomName, 
        DateTime StartTime, 
        DateTime EndTime, 
        int MaxAttendees, 
        int CurrentBookings,
        int WaitlistCount, 
        bool IsCancelled);

    public record GetAdminClassesQuery() : IRequest<List<AdminClassDto>>;

    public class GetAdminClassesQueryHandler(IApplicationDbContext context) : IRequestHandler<GetAdminClassesQuery, List<AdminClassDto>>
    {
        public async Task<List<AdminClassDto>> Handle(GetAdminClassesQuery request, CancellationToken cancellationToken)
        {
            return await context.GroupClasses
                .Include(c => c.Coach).ThenInclude(u => u.Details)
                .Include(c => c.Room)
                .AsNoTracking()
                .OrderByDescending(c => c.StartTime)
                .Select(c => new AdminClassDto(
                    c.Id,
                    c.Name,
                    c.Coach != null && c.Coach.Details != null 
                        ? $"{c.Coach.Details.FirstName} {c.Coach.Details.LastName}" 
                        : "To be announced",
                    c.Room.Name,
                    c.StartTime,
                    c.EndTime,
                    c.MaxAttendees,
                    c.Reservations.Count(r => r.Status == Domain.Enums.ReservationStatus.Confirmed),
                    c.Reservations.Count(r => r.Status == Domain.Enums.ReservationStatus.Waitlist),
                    c.IsCancelled
                ))
                .ToListAsync(cancellationToken);
        }
    }
}