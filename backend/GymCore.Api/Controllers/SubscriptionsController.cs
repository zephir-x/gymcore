using System.Security.Claims;
using GymCore.Application.Features.Subscriptions.Commands.BuySubscription;
using GymCore.Application.Features.Subscriptions.Queries.GetMySubscription;
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
            var tiers = await sender.Send(new Application.Features.Subscriptions.Queries.GetSubscriptionTiers.GetSubscriptionTiersQuery());
            return Ok(tiers);
        }
        
        [HttpPost("purchase/{tierId}")]
        public async Task<IActionResult> PurchaseSubscription(Guid tierId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var command = new BuySubscriptionCommand(userId, tierId);
            var subscriptionId = await sender.Send(command);

            return Ok(new { Message = "Subscription purchased successfully!", SubscriptionId = subscriptionId });
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
    }
}