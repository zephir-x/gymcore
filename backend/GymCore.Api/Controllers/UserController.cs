using GymCore.Application.Features.Users.Commands.UpdateProfile;
using GymCore.Application.Features.Users.Commands.UpdateMetrics;
using GymCore.Application.Features.Users.Commands.UpdateSecurity;
using GymCore.Application.Features.Users.Queries.GetMyProfile;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Everyone must be logged in (Member, Coach, Admin)
    public class UsersController(ISender sender) : ControllerBase
    {
        // Helper method to extract the logged-in user's ID securely from the JWT token
        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                throw new UnauthorizedAccessException("Invalid or missing user identity in token.");
            return userId;
        }

        // Fetch the current user's full profile (Basic Info + Metrics)
        [HttpGet("me/profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            var profile = await sender.Send(new GetMyProfileQuery(userId));
            return Ok(profile);
        }

        // Update Basic Profile Info (First Name, Last Name, Phone, Avatar, Bio)
        [HttpPut("me/profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileCommand command)
        {
            // We force the command to execute only for the currently logged in user
            var secureCommand = command with { UserId = GetCurrentUserId() };
            
            await sender.Send(secureCommand);
            return Ok(new { Message = "Profile updated successfully." });
        }

        // Update Body Metrics (Weight, Height, BodyFat) - Primarily for Members
        [HttpPut("me/metrics")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> UpdateMyMetrics([FromBody] UpdateMetricsCommand command)
        {
            var secureCommand = command with { UserId = GetCurrentUserId() };
            
            await sender.Send(secureCommand);
            return Ok(new { Message = "Body metrics updated successfully." });
        }
        
        [HttpPut("me/security")]
        public async Task<IActionResult> UpdateMySecurity([FromBody] UpdateSecurityCommand command)
        {
            var secureCommand = command with { UserId = GetCurrentUserId() };
            await sender.Send(secureCommand);
            return Ok(new { Message = "Security settings updated." });
        }
    }
}