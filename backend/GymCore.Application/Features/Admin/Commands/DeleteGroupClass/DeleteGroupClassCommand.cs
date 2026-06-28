using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.DeleteGroupClass
{
    public record DeleteGroupClassCommand(Guid ClassId) : IRequest;

    public class DeleteGroupClassCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteGroupClassCommand>
    {
        public async Task Handle(DeleteGroupClassCommand request, CancellationToken cancellationToken)
        {
            var groupClass = await context.GroupClasses
                .Include(c => c.Reservations)
                .FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

            if (groupClass == null) throw new Exception("Class not found.");
            if (groupClass.IsCancelled) throw new Exception("Class is already cancelled.");
            
            groupClass.CancelClass();
            
            var activeReservations = groupClass.Reservations
                .Where(r => r.Status != ReservationStatus.Cancelled)
                .ToList();

            foreach (var reservation in activeReservations)
            {
                var notification = new Notification(
                    reservation.UserId,
                    "Class Cancelled",
                    $"Attention: The group class '{groupClass.Name}' scheduled for {groupClass.StartTime:MMM dd, yyyy HH:mm} has been cancelled by the facility."
                );
                context.Notifications.Add(notification);
            }
            
            var coachNotification = new Notification(
                groupClass.CoachId,
                "Class Cancelled by Admin",
                $"Your scheduled class '{groupClass.Name}' on {groupClass.StartTime:MMM dd, yyyy HH:mm} has been cancelled by the administrator. It has been removed from your agenda."
            );
            context.Notifications.Add(coachNotification);
            
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}