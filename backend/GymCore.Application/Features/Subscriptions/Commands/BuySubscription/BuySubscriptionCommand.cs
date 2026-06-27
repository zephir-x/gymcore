using GymCore.Application.Common.Interfaces;
using GymCore.Application.Common.Services;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe.Checkout;

namespace GymCore.Application.Features.Subscriptions.Commands.BuySubscription
{
    public record BuySubscriptionCommand(Guid UserId, Guid TierId, int Months) : IRequest<string>;

    public class BuySubscriptionCommandHandler(IApplicationDbContext context, IConfiguration configuration, StripePaymentService stripeService)
        : IRequestHandler<BuySubscriptionCommand, string>
    {
        public async Task<string> Handle(BuySubscriptionCommand request, CancellationToken cancellationToken)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            var tier = await context.SubscriptionTiers.FindAsync([request.TierId], cancellationToken);
            
            if (user == null || tier == null) throw new Exception("User or Tier not found.");

            // Upgrade logic
            var activeSub = await context.UserSubscriptions
                .Include(s => s.Tier)
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            decimal credit = 0;
            if (activeSub != null)
            {
                // We calculate how much money is "left" from the current package
                credit = stripeService.CalculateUpgradeCredit(activeSub.StartDate, activeSub.EndDate, activeSub.Tier.MonthlyPrice);
            }

            // We calculate the price of the new package
            decimal priceForNew = tier.MonthlyPrice;
            if (request.Months == 6) priceForNew = tier.MonthlyPrice * 6 * 0.90m;
            else if (request.Months == 12) priceForNew = tier.MonthlyPrice * 12 * 0.81m;
            else priceForNew = tier.MonthlyPrice * request.Months;

            // Amount to be paid = Price of the new one - Credit from the old one (minimum PLN 1)
            decimal amountToPay = Math.Max(1, priceForNew - credit);
            
            // Stripe Checkout
            var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card", "blik" },
                CustomerEmail = user.Email,
                LineItems = new List<SessionLineItemOptions> {
                    new SessionLineItemOptions {
                        PriceData = new SessionLineItemPriceDataOptions {
                            UnitAmount = (long)(amountToPay * 100),
                            Currency = "pln",
                            ProductData = new SessionLineItemPriceDataProductDataOptions { Name = $"GymCore {tier.Name} Upgrade" }
                        },
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                SuccessUrl = $"{frontendUrl}/?payment=success",
                CancelUrl = $"{frontendUrl}/subscriptions?payment=cancelled",
                Metadata = new Dictionary<string, string> {
                    { "UserId", request.UserId.ToString() },
                    { "TierId", request.TierId.ToString() },
                    { "Months", request.Months.ToString() }
                }
            };

            return (await new SessionService().CreateAsync(options)).Url;
        }
    }
}