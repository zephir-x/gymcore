using FluentValidation;

namespace GymCore.Application.Features.Users.Commands.UpdateSecurity
{
    public class UpdateSecurityCommandValidator : AbstractValidator<UpdateSecurityCommand>
    {
        public UpdateSecurityCommandValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Invalid email format.");

            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Current password is required to verify your identity.");

            RuleFor(x => x.NewPassword)
                .MinimumLength(6).WithMessage("New password must be at least 6 characters long.")
                .When(x => !string.IsNullOrEmpty(x.NewPassword));
        }
    }
}