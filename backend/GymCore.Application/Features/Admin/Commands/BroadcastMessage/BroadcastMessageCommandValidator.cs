using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.BroadcastMessage
{
    public class BroadcastMessageCommandValidator : AbstractValidator<BroadcastMessageCommand>
    {
        public BroadcastMessageCommandValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(100).WithMessage("Title must not exceed 100 characters.");

            RuleFor(x => x.Message)
                .NotEmpty().WithMessage("Message is required.")
                .MaximumLength(1000).WithMessage("Message must not exceed 1000 characters.");
        }
    }
}