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
        int MaxAttendees,
        string? ImageUrl) : IRequest<Guid>;

    public class CreateGroupClassCommandHandler(IApplicationDbContext context)
        : IRequestHandler<CreateGroupClassCommand, Guid>
    {
        public async Task<Guid> Handle(CreateGroupClassCommand request, CancellationToken cancellationToken)
        {
            // We check the room and its limits
            var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);
            if (room == null) throw new Exception("Room not found.");

            if (request.MaxAttendees > room.MaxCapacity)
                throw new Exception($"Cannot set {request.MaxAttendees} attendees. Room '{room.Name}' has a maximum capacity of {room.MaxCapacity}.");

            // We check if it's actually the coach
            var coachExists = await context.Users.AnyAsync(u => u.Id == request.CoachId && u.Role == Domain.Enums.UserRole.Coach, cancellationToken);
            if (!coachExists) throw new Exception("Coach not found or user is not a trainer.");

            // Overlap Validation
            var roomIsOccupied = await context.GroupClasses
                .AnyAsync(c => c.RoomId == request.RoomId && 
                               request.StartTime < c.EndTime && 
                               request.EndTime > c.StartTime, cancellationToken);

            if (roomIsOccupied) 
                throw new Exception("This room is already booked for another class during the selected time frame.");

            // Registration
            var groupClass = new GroupClass(
                request.Name,
                request.CoachId,
                request.RoomId,
                request.StartTime,
                request.EndTime,
                request.MaxAttendees,
                request.ImageUrl
            );

            context.GroupClasses.Add(groupClass);
            await context.SaveChangesAsync(cancellationToken);

            return groupClass.Id;
        }
    }
}