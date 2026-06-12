using System.Security.Claims;
using GymCore.Application.Features.Bookings.Commands.BookClass;
using GymCore.Application.Features.Bookings.Queries.GetAvailableClasses;
using GymCore.Application.Features.Bookings.Queries.GetUserReservations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingsController(ISender sender) : ControllerBase
    {
        [HttpGet("classes")]
        public async Task<IActionResult> GetAvailableClasses()
        {
            var query = new GetAvailableClassesQuery();
            var classes = await sender.Send(query);
            
            return Ok(classes);
        }
        
        [HttpPost("classes/{classId}")]
        public async Task<IActionResult> BookClass(Guid classId)
        {
            // We securely extract the user ID directly from their token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            // We create a command by combining data from the URL parameter and the JWT token
            var command = new BookClassCommand(classId, userId);
            
            var reservationId = await sender.Send(command);

            return Ok(new { Message = "Successfully booked the class!", ReservationId = reservationId });
        }
        
        [HttpGet("coaches/{coachId}/slots")]
        public async Task<IActionResult> GetAvailableTrainerSlots(Guid coachId)
        {
            var query = new Application.Features.Bookings.Queries.GetAvailableTrainerSlots.GetAvailableTrainerSlotsQuery(coachId);
            var slots = await sender.Send(query);
            
            return Ok(slots);
        }

        [HttpPost("trainer-slots/{slotId}")]
        public async Task<IActionResult> BookTrainerSlot(Guid slotId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var command = new Application.Features.Bookings.Commands.BookTrainerSlot.BookTrainerSlotCommand(slotId, userId);
            await sender.Send(command);

            return Ok(new { Message = "Personal training session booked successfully." });
        }
        
        [HttpGet("my-reservations")]
        public async Task<IActionResult> GetMyReservations()
        {
            // Extract the user ID securely from the JWT claim
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var query = new GetUserReservationsQuery(userId);
            var reservations = await sender.Send(query);
            
            return Ok(reservations);
        }
        
        [HttpDelete("reservations/{reservationId}")]
        public async Task<IActionResult> CancelReservation(Guid reservationId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var command = new Application.Features.Bookings.Commands.CancelReservation.CancelReservationCommand(reservationId, userId);
            
            await sender.Send(command);

            return Ok(new { Message = "Reservation cancelled successfully." });
        }
    }
}