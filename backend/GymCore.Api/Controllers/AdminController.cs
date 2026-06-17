using GymCore.Application.Features.Admin.Commands.CreateGroupClass;
using GymCore.Application.Features.Admin.Commands.CreateRoom;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Only users with a JWT containing the 'Admin' role claim can enter
    [Authorize(Roles = "Admin")]
    public class AdminController(ISender sender) : ControllerBase
    {
        // Rooms management  

        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await sender.Send(new Application.Features.Admin.Queries.GetRooms.GetRoomsQuery());
            return Ok(rooms);
        }

        [HttpPost("rooms")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomCommand command)
        {
            var roomId = await sender.Send(command);
            return Ok(new { Message = "Room created successfully.", RoomId = roomId });
        }
        
        [HttpPut("rooms/{roomId}")]
        public async Task<IActionResult> UpdateRoom(Guid roomId, [FromBody] GymCore.Application.Features.Admin.Commands.UpdateRoom.UpdateRoomCommand command)
        {
            if (roomId != command.RoomId) return BadRequest("Route ID matches no Command ID.");
            
            await sender.Send(command);
            return Ok(new { Message = "Room updated successfully." });
        }

        [HttpDelete("rooms/{roomId}")]
        public async Task<IActionResult> DeleteRoom(Guid roomId)
        {
            await sender.Send(new GymCore.Application.Features.Admin.Commands.DeleteRoom.DeleteRoomCommand(roomId));
            return Ok(new { Message = "Room deleted successfully." });
        }
        
        // Users & Coaches management

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role)
        {
            // Handles both ?role=Coach and ?role=Member
            var users = await sender.Send(new Application.Features.Admin.Queries.GetUsers.GetUsersQuery(role));
            return Ok(users);
        }

        [HttpPost("coaches")]
        public async Task<IActionResult> CreateCoach([FromBody] GymCore.Application.Features.Admin.Commands.CreateTrainer.CreateTrainerCommand command)
        {
            var coachId = await sender.Send(command);
            return Ok(new { Message = "Trainer profile created successfully.", CoachId = coachId });
        }

        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] GymCore.Application.Features.Admin.Commands.UpdateUser.UpdateUserCommand command)
        {
            if (userId != command.UserId) return BadRequest("Route ID matches no Command ID.");
            
            await sender.Send(command);
            return Ok(new { Message = "User profile and credentials updated successfully." });
        }

        [HttpPatch("users/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(Guid userId)
        {
            await sender.Send(new GymCore.Application.Features.Admin.Commands.ToggleUserStatus.ToggleUserStatusCommand(userId));
            return Ok(new { Message = "User status toggled successfully." });
        }

        // 3. Schedule management

        [HttpPost("classes")]
        public async Task<IActionResult> CreateGroupClass([FromBody] CreateGroupClassCommand command)
        {
            var classId = await sender.Send(command);
            return Ok(new { Message = "Group class scheduled successfully.", ClassId = classId });
        }
    }
}