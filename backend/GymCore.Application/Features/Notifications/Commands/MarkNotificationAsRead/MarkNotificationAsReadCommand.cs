using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Notifications.Commands.MarkNotificationAsRead
{
    public record MarkNotificationAsReadCommand(Guid NotificationId, Guid UserId) : IRequest;

    public class MarkNotificationAsReadCommandHandler(IApplicationDbContext context) : IRequestHandler<MarkNotificationAsReadCommand>
    {
        public async Task Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
        {
            var notification = await context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == request.UserId, cancellationToken);

            if (notification != null && !notification.IsRead)
            {
                notification.MarkAsRead();
                await context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}