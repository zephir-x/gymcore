using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Bookings.Queries.GetAvailableTrainerSlots
{
    public record TrainerSlotDto(Guid Id, DateTime StartTime, DateTime EndTime);

    public record GetAvailableTrainerSlotsQuery(Guid CoachId) : IRequest<List<TrainerSlotDto>>;

    public class GetAvailableTrainerSlotsQueryHandler(IApplicationDbContext context)
        : IRequestHandler<GetAvailableTrainerSlotsQuery, List<TrainerSlotDto>>
    {
        public async Task<List<TrainerSlotDto>> Handle(GetAvailableTrainerSlotsQuery request, CancellationToken cancellationToken)
        {
            return await context.TrainerSlots
                .AsNoTracking()
                .Where(s => s.CoachId == request.CoachId 
                            && s.Status == SlotStatus.Available 
                            && s.StartTime > DateTime.UtcNow) // Only future and free
                .OrderBy(s => s.StartTime)
                .Select(s => new TrainerSlotDto(s.Id, s.StartTime, s.EndTime))
                .ToListAsync(cancellationToken);
        }
    }
}