using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Coaches.Commands.CreateTrainerSlot
{
    // CoachId will be injected by Controller from JWT token
    public record CreateTrainerSlotCommand(Guid CoachId, DateTime StartTime, DateTime EndTime) : IRequest<Guid>;

    public class CreateTrainerSlotCommandHandler(IApplicationDbContext context)
        : IRequestHandler<CreateTrainerSlotCommand, Guid>
    {
        public async Task<Guid> Handle(CreateTrainerSlotCommand request, CancellationToken cancellationToken)
        {
            // We check if this user is really a trainer
            var coach = await context.Users.FirstOrDefaultAsync(u => u.Id == request.CoachId, cancellationToken);
            if (coach == null || coach.Role != Domain.Enums.UserRole.Coach)
                throw new Exception("Only coaches can create availability slots.");

            // Is the coach no longer available at this time? (Date overlap)
            var hasOverlappingSlot = await context.TrainerSlots
                .AnyAsync(s => s.CoachId == request.CoachId && 
                               s.StartTime < request.EndTime && 
                               s.EndTime > request.StartTime, cancellationToken);

            if (hasOverlappingSlot)
                throw new Exception("You already have an availability slot during this time.");

            // We create and save a slot
            var slot = new TrainerSlot(request.CoachId, request.StartTime, request.EndTime);

            context.TrainerSlots.Add(slot);
            await context.SaveChangesAsync(cancellationToken);

            return slot.Id;
        }
    }
}