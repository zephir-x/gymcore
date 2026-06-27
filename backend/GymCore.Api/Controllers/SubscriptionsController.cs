using System.Security.Claims;
using GymCore.Application.Features.Subscriptions.Commands.BuySubscription;
using GymCore.Application.Features.Subscriptions.Commands.CancelSubscription;
using GymCore.Application.Features.Subscriptions.Queries.GetMySubscription;
using GymCore.Application.Features.Subscriptions.Queries.GetSubscriptionTiers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires login
    public class SubscriptionsController(ISender sender) : ControllerBase
    {
        [HttpGet("tiers")]
        public async Task<IActionResult> GetTiers()
        {
            var tiers = await sender.Send(new GetSubscriptionTiersQuery());
            return Ok(tiers);
        }
        
        [HttpPost("purchase/{tierId}")]
        public async Task<IActionResult> PurchaseSubscription(Guid tierId, [FromBody] PurchaseRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var command = new BuySubscriptionCommand(userId, tierId, request.Months);
            var checkoutUrl = await sender.Send(command);

            // We are backing the URL to frontend
            return Ok(new { CheckoutUrl = checkoutUrl });
        }
        
        [HttpPost("cancel")]
        public async Task<IActionResult> CancelSubscription()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var checkoutUrl = await sender.Send(new CancelSubscriptionCommand(userId));

            if (checkoutUrl == null)
            {
                return Ok(new { Message = "Subscription cancelled successfully." });
            }

            return Ok(new { CheckoutUrl = checkoutUrl });
        }
        
        [HttpGet("my-subscription")]
        public async Task<IActionResult> GetMySubscription()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var query = new GetMySubscriptionQuery(userId);
            var subscription = await sender.Send(query);

            if (subscription == null)
            {
                return NotFound(new { Message = "You do not have an active subscription." });
            }

            return Ok(subscription);
        }
        
        // Small DTO specifically for receiving the JSON payload from React
        public record PurchaseRequest(int Months);
    }
}