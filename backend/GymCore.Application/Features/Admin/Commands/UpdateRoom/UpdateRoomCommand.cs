using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.UpdateRoom
{
    public record UpdateRoomCommand(Guid RoomId, string Name, int MaxCapacity, string? ImageUrl, Guid? RequiredTierId, string? Description) : IRequest;

    public class UpdateRoomCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateRoomCommand>
    {
        public async Task Handle(UpdateRoomCommand request, CancellationToken cancellationToken)
        {
            var room = await context.Rooms
                .FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);
                
            if (room == null) 
                throw new Exception("Room not found.");
            
            room.UpdateDetails(request.Name, request.MaxCapacity, request.ImageUrl, request.RequiredTierId, request.Description);
            
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}