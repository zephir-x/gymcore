using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.CreateGroupClass
{
    public class CreateGroupClassCommandValidator : AbstractValidator<CreateGroupClassCommand>
    {
        public CreateGroupClassCommandValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
            RuleFor(x => x.CoachId).NotEmpty();
            RuleFor(x => x.RoomId).NotEmpty();
            RuleFor(x => x.MaxAttendees).GreaterThan(0);
            
            // End date must be after start date
            RuleFor(x => x.EndTime)
                .GreaterThan(x => x.StartTime).WithMessage("End time must be after start time.");
        }
    }
}