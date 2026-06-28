using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.BroadcastMessage
{
    public record BroadcastMessageCommand(string Title, string Message) : IRequest;

    public class BroadcastMessageCommandHandler(IApplicationDbContext context) : IRequestHandler<BroadcastMessageCommand>
    {
        public async Task Handle(BroadcastMessageCommand request, CancellationToken cancellationToken)
        {
            // We collect the ID of all users (Members and Coaches), we bypass the disabled ones
            var activeUsersIds = await context.Users
                .Where(u => u.IsActive)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var notifications = activeUsersIds.Select(userId => 
                new Notification(userId, request.Title, request.Message)
            ).ToList();

            context.Notifications.AddRange(notifications);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}