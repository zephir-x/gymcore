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
		[HttpGet("agenda")]
    	public async Task<IActionResult> GetMyAgenda()
    	{
        	var coachIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        	if (!Guid.TryParse(coachIdString, out var coachId))
            	return Unauthorized("Invalid token.");

        	var agenda = await sender.Send(new Application.Features.Coaches.Queries.GetCoachAgenda.GetCoachAgendaQuery(coachId));
        	return Ok(agenda);
    	}

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

		[HttpDelete("slots/{slotId}")]
        public async Task<IActionResult> CancelSlot(Guid slotId)
        {
            var coachIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(coachIdString, out var coachId))
                return Unauthorized("Invalid token.");

            await sender.Send(new Application.Features.Coaches.Commands.CancelTrainerSlot.CancelTrainerSlotCommand(slotId, coachId));
            
            return Ok(new { Message = "Slot cancelled successfully." });
        }
    }

    // Auxiliary DTO record only for the JSON shape coming from the Frontend
    public record CreateSlotRequest(DateTime StartTime, DateTime EndTime);
}