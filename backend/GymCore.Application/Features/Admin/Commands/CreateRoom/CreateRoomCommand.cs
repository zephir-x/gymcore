using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;

namespace GymCore.Application.Features.Admin.Commands.CreateRoom
{
    public record CreateRoomCommand(string Name, int MaxCapacity, string? ImageUrl, Guid? RequiredTierId) : IRequest<Guid>;

    public class CreateRoomCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateRoomCommand, Guid>
    {
        public async Task<Guid> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
        {
            var room = new Room(request.Name, request.MaxCapacity, request.ImageUrl, request.RequiredTierId);
            
            context.Rooms.Add(room);
            await context.SaveChangesAsync(cancellationToken);

            return room.Id;
        }
    }
}