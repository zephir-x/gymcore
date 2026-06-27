using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace GymCore.Application.Features.Subscriptions.Commands.CancelSubscription
{
    public record CancelSubscriptionCommand(Guid UserId) : IRequest<string?>;

    public class CancelSubscriptionCommandHandler(IApplicationDbContext context, IConfiguration configuration)
        : IRequestHandler<CancelSubscriptionCommand, string?>
    {
        public async Task<string?> Handle(CancelSubscriptionCommand request, CancellationToken cancellationToken)
        {
            var activeSubscription = await context.UserSubscriptions
                .Include(s => s.Tier)
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active, cancellationToken);

            if (activeSubscription == null)
                throw new Exception("You do not have any active subscription to cancel.");

            if (string.IsNullOrEmpty(activeSubscription.PaymentIntentId))
            {
                activeSubscription.Cancel();
                await context.SaveChangesAsync(cancellationToken);
                return null;
            }

            // Calculate refund amount
            var totalPaid = activeSubscription.Tier.MonthlyPrice;
            var refundAmount = 0m;
            
            if (!string.IsNullOrEmpty(activeSubscription.PaymentIntentId))
            {
                StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];
                var paymentIntentService = new PaymentIntentService();
                var paymentIntent = await paymentIntentService.GetAsync(activeSubscription.PaymentIntentId, cancellationToken: cancellationToken);
                totalPaid = paymentIntent.Amount / 100m;

                // This just calculates, it doesn't execute the refund yet
                var totalDays = (decimal)(activeSubscription.EndDate - activeSubscription.StartDate).TotalDays;
                var daysUsed = (decimal)(DateTime.UtcNow - activeSubscription.StartDate).TotalDays;
                var remainingRatio = Math.Max(0, (totalDays - daysUsed) / totalDays);
                refundAmount = Math.Max(0, (totalPaid * remainingRatio) - 20m);
            }

            // Create Stripe Checkout Session for Refund/Cancellation
            var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                Mode = "payment", // "payment" seems required for Stripe to create a session
                LineItems = new List<SessionLineItemOptions> {
                    new SessionLineItemOptions {
                        PriceData = new SessionLineItemPriceDataOptions {
                            UnitAmount = (long)(refundAmount * 100), // This is the refund amount
                            Currency = "pln",
                            ProductData = new SessionLineItemPriceDataProductDataOptions { Name = $"Refund for {activeSubscription.Tier.Name}" }
                        },
                        Quantity = 1,
                    },
                },
                SuccessUrl = $"{frontendUrl}/?cancellation=success",
                CancelUrl = $"{frontendUrl}/subscriptions?cancellation=cancelled",
                Metadata = new Dictionary<string, string> {
                    { "UserId", request.UserId.ToString() },
                    { "SubscriptionId", activeSubscription.Id.ToString() }
                }
            };

            var session = await new SessionService().CreateAsync(options);
            return session.Url;
        }
    }
}