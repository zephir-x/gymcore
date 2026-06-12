using FluentValidation;

namespace GymCore.Application.Features.Coaches.Commands.CreateTrainerSlot
{
    public class CreateTrainerSlotCommandValidator : AbstractValidator<CreateTrainerSlotCommand>
    {
        public CreateTrainerSlotCommandValidator()
        {
            RuleFor(x => x.CoachId).NotEmpty();
            
            RuleFor(x => x.StartTime)
                .NotEmpty()
                .GreaterThan(DateTime.UtcNow).WithMessage("Slot start time must be in the future.");

            RuleFor(x => x.EndTime)
                .NotEmpty()
                .GreaterThan(x => x.StartTime).WithMessage("End time must be after the start time.");
        }
    }
}