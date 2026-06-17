using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.UpdateUser
{
    public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
    {
        public UpdateUserCommandValidator()
        {
            RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required.");
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50).WithMessage("First name is required.");
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(50).WithMessage("Last name is required.");
        }
    }
}