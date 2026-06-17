using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.DeleteRoom
{
    public record DeleteRoomCommand(Guid RoomId) : IRequest;

    public class DeleteRoomCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteRoomCommand>
    {
        public async Task Handle(DeleteRoomCommand request, CancellationToken cancellationToken)
        {
            var room = await context.Rooms
                .FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);
                
            if (room == null) 
                throw new Exception("Room not found.");

            // Protection against removal of the room where classes are scheduled
            var hasFutureClasses = await context.GroupClasses
                .AnyAsync(c => c.RoomId == request.RoomId && c.StartTime > DateTime.UtcNow, cancellationToken);

            if (hasFutureClasses)
                throw new Exception("Cannot delete this room. There are upcoming classes scheduled in it.");

            context.Rooms.Remove(room);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}