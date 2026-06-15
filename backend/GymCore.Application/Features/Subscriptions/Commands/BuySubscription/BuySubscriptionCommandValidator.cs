using FluentValidation;

namespace GymCore.Application.Features.Subscriptions.Commands.BuySubscription
{
    public class BuySubscriptionCommandValidator : AbstractValidator<BuySubscriptionCommand>
    {
        public BuySubscriptionCommandValidator()
        {
            // We ensure that the IDs are not default/empty GUIDs
            RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
            RuleFor(x => x.TierId).NotEmpty().WithMessage("Subscription Tier ID is required.");
            
            // We only allow purchasing for 1, 6, or 12 months
            RuleFor(x => x.Months)
                .Must(m => m == 1 || m == 6 || m == 12)
                .WithMessage("Subscription duration must be 1, 6, or 12 months.");
        }
    }
}