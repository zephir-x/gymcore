using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.CreateTrainer
{
    public class CreateTrainerCommandValidator : AbstractValidator<CreateTrainerCommand>
    {
        public CreateTrainerCommandValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required.");
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("Temporary password must be at least 6 characters.");
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50).WithMessage("First name is required and cannot exceed 50 characters.");
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(50).WithMessage("Last name is required and cannot exceed 50 characters.");
        }
    }
}