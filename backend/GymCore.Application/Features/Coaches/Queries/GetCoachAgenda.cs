using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Coaches.Queries.GetCoachAgenda
{
    public record AgendaDto(
        List<AgendaClassDto> AssignedClasses, 
        List<AgendaSlotDto> TrainerSlots
    );

    public record AgendaClassDto(Guid Id, string Name, DateTime StartTime, DateTime EndTime, int AttendeesCount);
    public record AgendaSlotDto(Guid Id, DateTime StartTime, DateTime EndTime, string Status);

    public record GetCoachAgendaQuery(Guid CoachId) : IRequest<AgendaDto>;

    public class GetCoachAgendaQueryHandler(IApplicationDbContext context) : IRequestHandler<GetCoachAgendaQuery, AgendaDto>
    {
        public async Task<AgendaDto> Handle(GetCoachAgendaQuery request, CancellationToken cancellationToken)
        {
            // We are downloading upcoming group classes with this trainer
            var classes = await context.GroupClasses
                .AsNoTracking()
                .Where(c => c.CoachId == request.CoachId && c.StartTime > DateTime.UtcNow)
                .OrderBy(c => c.StartTime)
                .Select(c => new AgendaClassDto(
                    c.Id, 
                    c.Name, 
                    c.StartTime, 
                    c.EndTime, 
                    c.Reservations.Count(r => r.Status == ReservationStatus.Confirmed)))
                .ToListAsync(cancellationToken);

            // We download free and occupied trainer slots
            var slots = await context.TrainerSlots
                .AsNoTracking()
                .Where(s => s.CoachId == request.CoachId && s.StartTime > DateTime.UtcNow)
                .OrderBy(s => s.StartTime)
                .Select(s => new AgendaSlotDto(
                    s.Id, 
                    s.StartTime, 
                    s.EndTime, 
                    s.Status.ToString()))
                .ToListAsync(cancellationToken);

            return new AgendaDto(classes, slots);
        }
    }
}