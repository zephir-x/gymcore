using System.IO;
using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using Stripe;
using Stripe.Checkout;

namespace GymCore.Api.Controllers
{
    [Route("api/webhooks/stripe")]
    [ApiController]
    [AllowAnonymous]
    [IgnoreAntiforgeryToken]
    public class WebhooksController(IApplicationDbContext context, IConfiguration configuration, ILogger<WebhooksController> logger) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> HandleStripeWebhook()
        {
            // We receive plain text from the HTTP request (JSON from Stripe)
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            
            // We get our secret key 
            var endpointSecret = configuration["Stripe:WebhookSecret"];

            try
            {
                // Cryptographic Verification
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    endpointSecret
                );

                // We are only interested in the event: "Payment Session Completed Successfully"
                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session == null || session.Metadata == null)
                    {
                        logger.LogError("Webhook received without metadata or invalid session.");
                        return BadRequest("Invalid metadata.");
                    }
                    
                    if (session.Metadata.ContainsKey("TierId"))
                    {
                        // We're pulling out our secret metadata we've hidden in BuySubscriptionCommand
                        var userId = Guid.Parse(session.Metadata["UserId"]);
                        var tierId = Guid.Parse(session.Metadata["TierId"]);
                        var months = int.Parse(session.Metadata["Months"]);

                        logger.LogInformation($"Payment has been received. I am activating the package for user {userId}.");

                        // We close the old subscription if it exists
                        var activeSub = await context.UserSubscriptions
                            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);
                        
                        if (activeSub != null)
                        {
                            activeSub.Cancel();
                        }

                        // We are giving you a new subscription
                        var newSub = new UserSubscription(
                            userId,
                            tierId,
                            DateTime.UtcNow,
                            DateTime.UtcNow.AddMonths(months),
                            session.PaymentIntentId
                        );

                        context.UserSubscriptions.Add(newSub);
                        await context.SaveChangesAsync(default);
                        
                        logger.LogInformation("Subscription successfully updated in the database.");
                    }
                    else if (session.Metadata.ContainsKey("SubscriptionId"))
                    {
                        // Cancellation flow
                        var subscriptionId = Guid.Parse(session.Metadata["SubscriptionId"]);
                        
                        var sub = await context.UserSubscriptions.FindAsync(subscriptionId);
                        if (sub != null)
                        {
                            sub.Cancel();
                            await context.SaveChangesAsync(default);
                            logger.LogInformation($"Subscription {subscriptionId} successfully canceled.");
                        }
                        else
                        {
                            logger.LogError($"No subscriptions found to cancel: {subscriptionId}.");
                        }
                    }
                    else
                    {
                        logger.LogError("Webhook received with unknown metadata.");
                        return BadRequest("Unknown metadata.");
                    }
                }

                // We return "200 OK" so Stripe knows we received the package
                return Ok();
            }
            catch (StripeException e)
            {
                logger.LogError($"Stripe webhook signature error: {e.Message}");
                return BadRequest();
            }
            catch (Exception e)
            {
                logger.LogError($"General webhook error: {e.Message}");
                return StatusCode(500);
            }
        }
    }
}