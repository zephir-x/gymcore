using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Notifications.Queries.GetMyNotifications
{
    public record NotificationDto(Guid Id, string Title, string Message, bool IsRead, DateTime CreatedAt);

    public record GetMyNotificationsQuery(Guid UserId) : IRequest<List<NotificationDto>>;

    public class GetMyNotificationsQueryHandler(IApplicationDbContext context) : IRequestHandler<GetMyNotificationsQuery, List<NotificationDto>>
    {
        public async Task<List<NotificationDto>> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
        {
            return await context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == request.UserId)
                .OrderByDescending(n => n.CreatedAt) // Newest at the top
                .Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.IsRead, n.CreatedAt))
                .ToListAsync(cancellationToken);
        }
    }
}