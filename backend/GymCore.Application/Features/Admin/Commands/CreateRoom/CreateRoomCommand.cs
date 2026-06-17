using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;

namespace GymCore.Application.Features.Admin.Commands.CreateRoom
{
    // The command carries the name, capacity and required tier of the new room
    public record CreateRoomCommand(string Name, int MaxCapacity, Guid? RequiredTierId) : IRequest<Guid>;

    public class CreateRoomCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateRoomCommand, Guid>
    {
        public async Task<Guid> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
        {
            var room = new Room(request.Name, request.MaxCapacity, request.RequiredTierId);
            
            context.Rooms.Add(room);
            await context.SaveChangesAsync(cancellationToken);

            return room.Id;
        }
    }
}