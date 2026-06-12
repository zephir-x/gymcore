using System.Security.Claims;
using GymCore.Application.Features.Coaches.Commands.CreateTrainerSlot;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Coach")]
    public class CoachesController(ISender sender) : ControllerBase
    {
        [HttpPost("slots")]
        public async Task<IActionResult> CreateSlot([FromBody] CreateSlotRequest request)
        {
            // Securely extracting the trainer ID from the JWT
            var coachIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(coachIdString, out var coachId))
                return Unauthorized("Invalid token.");

            // We pack everything into the command
            var command = new CreateTrainerSlotCommand(coachId, request.StartTime, request.EndTime);
            var slotId = await sender.Send(command);

            return Ok(new { Message = "Availability slot created successfully.", SlotId = slotId });
        }
    }

    // Auxiliary DTO record only for the JSON shape coming from the Frontend
    public record CreateSlotRequest(DateTime StartTime, DateTime EndTime);
}