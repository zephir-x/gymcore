using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetUserReservations
{
    public record UserReservationDto(
        Guid ReservationId,
        Guid? TargetId,
        string Title,          // Name of the class or "Personal Training"
        string TrainerName,
        DateTime StartTime,
        DateTime EndTime,
        string Status,
        string Type           // "Group" or "Personal"
    );
    
    public record GetUserReservationsQuery(Guid UserId) : IRequest<List<UserReservationDto>>;

    public class GetUserReservationsQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetUserReservationsQuery, List<UserReservationDto>>
    {
        public async Task<List<UserReservationDto>> Handle(GetUserReservationsQuery request, CancellationToken cancellationToken)
        {
			// We are finding entities from the database
            var groupReservations = await context.ClassReservations
                .AsNoTracking()
                .Where(r => r.UserId == request.UserId && r.Status != ReservationStatus.Cancelled)
                .Include(r => r.GroupClass)
                .ThenInclude(c => c.Coach)
                .ThenInclude(u => u.Details)
                .ToListAsync(cancellationToken);

            var personalReservations = await context.TrainerSlots
                .AsNoTracking()
                .Where(s => s.ClientId == request.UserId && s.Status == SlotStatus.Booked) 
                .Include(s => s.Coach)
                .ThenInclude(u => u.Details)
                .ToListAsync(cancellationToken);

            // We map and connect safely in C# memory
            var allReservations = groupReservations.Select(r => new UserReservationDto(
                    r.Id,
                    r.GroupClass.Id,
                    r.GroupClass.Name,
                    $"{r.GroupClass.Coach.Details.FirstName} {r.GroupClass.Coach.Details.LastName}",
                    r.GroupClass.StartTime,
                    r.GroupClass.EndTime,
                    r.Status.ToString(),
                    "Group"
                ))
                .Concat(
                    personalReservations.Select(s => new UserReservationDto(
                        s.Id,
                        s.Id,
                        "Personal Training 1:1",
                        $"{s.Coach.Details.FirstName} {s.Coach.Details.LastName}",
                        s.StartTime,
                        s.EndTime,
                        "Confirmed",
                        "Personal"
                    ))
                )
                .OrderBy(r => r.StartTime)
                .ToList();

            return allReservations;
        }
    }
}