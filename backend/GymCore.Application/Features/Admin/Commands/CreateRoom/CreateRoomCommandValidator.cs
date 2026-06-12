using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.CreateRoom
{
    public class CreateRoomCommandValidator : AbstractValidator<CreateRoomCommand>
    {
        public CreateRoomCommandValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Room name is required.")
                .MaximumLength(100).WithMessage("Room name must not exceed 100 characters.");

            RuleFor(x => x.Capacity)
                .GreaterThan(0).WithMessage("Room capacity must be at least 1.");
        }
    }
}