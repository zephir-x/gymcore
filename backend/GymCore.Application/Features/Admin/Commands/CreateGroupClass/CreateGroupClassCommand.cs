using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.CreateGroupClass
{
    public record CreateGroupClassCommand(
        string Name, 
        Guid CoachId, 
        Guid RoomId, 
        DateTime StartTime, 
        DateTime EndTime, 
        int MaxAttendees) : IRequest<Guid>;

    public class CreateGroupClassCommandHandler(IApplicationDbContext context)
        : IRequestHandler<CreateGroupClassCommand, Guid>
    {
        public async Task<Guid> Handle(CreateGroupClassCommand request, CancellationToken cancellationToken)
        {
            // Verification whether the room exists
            var roomExists = await context.Rooms.AnyAsync(r => r.Id == request.RoomId, cancellationToken);
            if (!roomExists) throw new Exception("Room not found.");

            // Verification whether the trainer exists (and whether he actually has a coaching role)
            var coachExists = await context.Users.AnyAsync(u => u.Id == request.CoachId && u.Role == Domain.Enums.UserRole.Coach, cancellationToken);
            if (!coachExists) throw new Exception("Coach not found or invalid user role.");

            // Creating and saving an entity
            var groupClass = new GroupClass(
                request.Name,
                request.CoachId,
                request.RoomId,
                request.StartTime,
                request.EndTime,
                request.MaxAttendees
            );

            context.GroupClasses.Add(groupClass);
            await context.SaveChangesAsync(cancellationToken);

            return groupClass.Id;
        }
    }
}