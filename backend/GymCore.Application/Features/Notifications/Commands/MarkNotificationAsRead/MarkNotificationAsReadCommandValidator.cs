using FluentValidation;
using GymCore.Application.Features.Notifications.Commands.MarkNotificationAsRead;

namespace GymCore.Application.Features.Notifications.Commands.MarkAsRead
{
    public class MarkNotificationAsReadCommandValidator : AbstractValidator<MarkNotificationAsReadCommand>
    {
        public MarkNotificationAsReadCommandValidator()
        {
            RuleFor(x => x.NotificationId)
                .NotEmpty().WithMessage("Notification ID is required.");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required.");
        }
    }
}