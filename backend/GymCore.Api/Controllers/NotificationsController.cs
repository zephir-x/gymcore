using System.Security.Claims;
using GymCore.Application.Features.Notifications.Commands.MarkNotificationAsRead;
using GymCore.Application.Features.Notifications.Queries.GetMyNotifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController(ISender sender) : ControllerBase
    {
        [HttpGet("my-notifications")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var notifications = await sender.Send(new GetMyNotificationsQuery(userId));
            return Ok(notifications);
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            await sender.Send(new MarkNotificationAsReadCommand(id, userId));
            return Ok(new { Message = "Notification marked as read." });
        }
    }
}