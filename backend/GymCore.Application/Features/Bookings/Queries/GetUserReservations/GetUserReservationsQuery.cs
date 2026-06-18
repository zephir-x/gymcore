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
            // We take group reservations
            var groupReservations = await context.ClassReservations
                .AsNoTracking()
                .Where(r => r.UserId == request.UserId 
                            && r.Status != ReservationStatus.Cancelled 
                            && !r.GroupClass.IsCancelled)
                .Include(r => r.GroupClass)
                .ThenInclude(c => c.Coach)
                .ThenInclude(u => u.Details)
                .ToListAsync(cancellationToken);

            // We take reservations 1:1
            var personalReservations = await context.TrainerSlots
                .AsNoTracking()
                .Where(s => s.ClientId == request.UserId && s.Status == SlotStatus.Booked) 
                .Include(s => s.Coach)
                .ThenInclude(u => u.Details)
                .ToListAsync(cancellationToken);

            // We map and connect data
            var allReservations = groupReservations.Select(r => new UserReservationDto(
                    r.Id,
                    r.GroupClass.Id,
                    r.GroupClass.Name,
                    $"{r.GroupClass.Coach.Details.FirstName} {r.GroupClass.Coach.Details.LastName}",
                    r.GroupClass.StartTime,
                    r.GroupClass.EndTime,
                    
                    // If the gym cancels classes, we overwrite the status so the customer can see it
                    r.GroupClass.IsCancelled ? "Class Cancelled by Gym" : r.Status.ToString(),
                    
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