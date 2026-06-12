using FluentValidation;

namespace GymCore.Application.Features.Auth.Queries.Login
{
    // Basic validation to prevent unnecessary database hits for empty fields
    public class LoginUserQueryValidator : AbstractValidator<LoginUserQuery>
    {
        public LoginUserQueryValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}