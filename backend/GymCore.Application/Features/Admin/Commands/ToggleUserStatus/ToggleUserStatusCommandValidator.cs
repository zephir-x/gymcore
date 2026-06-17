using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.ToggleUserStatus
{
    public class ToggleUserStatusCommandValidator : AbstractValidator<ToggleUserStatusCommand>
    {
        public ToggleUserStatusCommandValidator()
        {
            RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required to toggle status.");
        }
    }
}