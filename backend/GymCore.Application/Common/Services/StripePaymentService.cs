using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace GymCore.Application.Common.Services
{
    public class StripePaymentService(IConfiguration configuration)
    {
        private readonly string _secretKey = configuration["Stripe:SecretKey"] ?? throw new ArgumentNullException("Stripe:SecretKey is missing in configuration");

        // The logic of return with penalty
        public async Task<decimal> RefundWithPenalty(string paymentIntentId, DateTime startDate, DateTime endDate, decimal totalPaid)
        {
            StripeConfiguration.ApiKey = _secretKey;
            
            var totalDays = (decimal)(endDate - startDate).TotalDays;
            var daysUsed = (decimal)(DateTime.UtcNow - startDate).TotalDays;
            var remainingRatio = Math.Max(0, (totalDays - daysUsed) / totalDays);
            
            // Amount to be refunded = (Proportional change - PLN 20 penalty)
            var refundAmount = (totalPaid * remainingRatio) - 20m;
            var finalRefund = Math.Max(0, refundAmount);

            if (finalRefund > 0)
            {
                var service = new RefundService();
                await service.CreateAsync(new RefundCreateOptions { 
                    PaymentIntent = paymentIntentId, 
                    Amount = (long)(finalRefund * 100) 
                });
            }
            return finalRefund;
        }

        // Upgrade Loan Calculation Logic
        public decimal CalculateUpgradeCredit(DateTime startDate, DateTime endDate, decimal originalPrice)
        {
            var totalDays = (decimal)(endDate - startDate).TotalDays;
            var daysUsed = (decimal)(DateTime.UtcNow - startDate).TotalDays;
            var remainingDays = Math.Max(0, totalDays - daysUsed);
            
            return originalPrice * (remainingDays / totalDays);
        }
    }
}