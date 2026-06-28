using System.Security.Claims;
using GymCore.Application.Features.Bookings.Commands.BookClass;
using GymCore.Application.Features.Bookings.Queries.GetAvailableClasses;
using GymCore.Application.Features.Bookings.Queries.GetUserReservations;
using GymCore.Application.Features.Admin.Queries.GetRooms;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires a valid JWT token to access any endpoint in this controller
    public class BookingsController(ISender sender) : ControllerBase
    {
        // Retrieves a list of future group classes available for booking
        [HttpGet("classes")]
        public async Task<IActionResult> GetAvailableClasses()
        {
            var query = new GetAvailableClassesQuery();
            var classes = await sender.Send(query);
            
            return Ok(classes);
        }
        
        // Books a spot in a specific group class for the authenticated user
        [HttpPost("classes/{classId}")]
        public async Task<IActionResult> BookClass(Guid classId)
        {
            // Securely extract the user ID directly from their JWT token to prevent impersonation
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var command = new BookClassCommand(classId, userId);
            
            var result = await sender.Send(command);

            // Dynamic status-based message
            var message = result.Status == GymCore.Domain.Enums.ReservationStatus.Waitlist
                ? "You have been added to the waitlist!"
                : "Successfully booked the class!";

            return Ok(new { Message = message, ReservationId = result.ReservationId });
        }
        
        // Retrieves a list of all coaches available for personal training
        [HttpGet("coaches")]
        public async Task<IActionResult> GetCoaches()
        {
            var coaches = await sender.Send(new Application.Features.Bookings.Queries.GetCoaches.GetCoachesQuery());
            return Ok(coaches);
        }

        // Retrieves available 1:1 time slots for a specific coach
        [HttpGet("coaches/{coachId}/slots")]
        public async Task<IActionResult> GetAvailableTrainerSlots(Guid coachId)
        {
            var query = new Application.Features.Bookings.Queries.GetAvailableTrainerSlots.GetAvailableTrainerSlotsQuery(coachId);
            var slots = await sender.Send(query);
            
            return Ok(slots);
        }

        // Books a specific 1:1 training slot with a coach
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
        
        // Retrieves a unified list of both group classes and personal training sessions booked by the user
        [HttpGet("my-reservations")]
        public async Task<IActionResult> GetMyReservations()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user token.");

            var query = new GetUserReservationsQuery(userId);
            var reservations = await sender.Send(query);
            
            return Ok(reservations);
        }
        
        // Cancels a user's reservation (handles both group classes and 1:1 slots dynamically)
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
        
        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            var result = await sender.Send(new GetRoomsQuery());
            return Ok(result);
        }
    }
}