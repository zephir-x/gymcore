using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;

namespace GymCore.Application.Features.Admin.Commands.CreateRoom
{
    // The command carries the name and capacity of the new room
    public record CreateRoomCommand(string Name, int Capacity) : IRequest<Guid>;

    public class CreateRoomCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateRoomCommand, Guid>
    {
        public async Task<Guid> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
        {
            // Business logic: check if a room with the same name already exists
            // For now, we will just create it directly
            var room = new Room(request.Name, request.Capacity);
            
            context.Rooms.Add(room);
            await context.SaveChangesAsync(cancellationToken);

            return room.Id;
        }
    }
}