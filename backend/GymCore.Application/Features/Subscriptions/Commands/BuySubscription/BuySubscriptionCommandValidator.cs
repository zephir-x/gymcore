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
        }
    }
}