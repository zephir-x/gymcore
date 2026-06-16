using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Coaches.Commands.CreateTrainerSlot
{
    public record CreateTrainerSlotCommand(Guid CoachId, DateTime StartTime, DateTime EndTime) : IRequest<Guid>;

    public class CreateTrainerSlotCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateTrainerSlotCommand, Guid>
    {
        public async Task<Guid> Handle(CreateTrainerSlotCommand request, CancellationToken cancellationToken)
        {
            // Time validation (slot must be in the future and have a reasonable duration)
            if (request.StartTime <= DateTime.UtcNow)
                throw new Exception("Cannot create slots in the past.");
            
            if (request.StartTime >= request.EndTime)
                throw new Exception("Start time must be before end time.");

            // Blocking collisions with group classes
            // We check if the trainer is already assigned to classes that overlap with this time
            var hasClassConflict = await context.GroupClasses
                .AnyAsync(c => c.CoachId == request.CoachId && 
                               c.StartTime < request.EndTime && 
                               c.EndTime > request.StartTime, cancellationToken);

            if (hasClassConflict)
                throw new Exception("You are already assigned to lead a group class during this time.");

            // Blocking collisions with other, already created trainer slots
            var hasSlotConflict = await context.TrainerSlots
                .AnyAsync(s => s.CoachId == request.CoachId && 
                               s.StartTime < request.EndTime && 
                               s.EndTime > request.StartTime, cancellationToken);

            if (hasSlotConflict)
                throw new Exception("You already have a trainer slot overlapping with this time.");

            // Succes: We are creating a new window
            var slot = new TrainerSlot(request.CoachId, request.StartTime, request.EndTime);
            
            context.TrainerSlots.Add(slot);
            await context.SaveChangesAsync(cancellationToken);

            return slot.Id;
        }
    }
}