using FluentValidation;

namespace GymCore.Application.Features.Users.Commands.UpdateMetrics
{
    public class UpdateMetricsCommandValidator : AbstractValidator<UpdateMetricsCommand>
    {
        public UpdateMetricsCommandValidator()
        {
            RuleFor(x => x.Weight)
                .GreaterThan(0).WithMessage("Weight must be greater than 0.")
                .LessThan(500).WithMessage("Weight value is unrealistic.")
                .When(x => x.Weight.HasValue);

            RuleFor(x => x.Height)
                .GreaterThan(0).WithMessage("Height must be greater than 0.")
                .LessThan(300).WithMessage("Height value is unrealistic.")
                .When(x => x.Height.HasValue);
        }
    }
}