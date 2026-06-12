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
        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await sender.Send(new Application.Features.Admin.Queries.GetRooms.GetRoomsQuery());
            return Ok(rooms);
        }

        [HttpGet("coaches")]
        public async Task<IActionResult> GetCoaches()
        {
            var coaches = await sender.Send(new Application.Features.Admin.Queries.GetCoaches.GetCoachesQuery());
            return Ok(coaches);
        }
        
        [HttpPost("rooms")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomCommand command)
        {
            var roomId = await sender.Send(command);
            
            return Ok(new { Message = "Room created successfully.", RoomId = roomId });
        }
        
        [HttpPost("classes")]
        public async Task<IActionResult> CreateGroupClass([FromBody] CreateGroupClassCommand command)
        {
            var classId = await sender.Send(command);
            
            return Ok(new { Message = "Group class scheduled successfully.", ClassId = classId });
        }
    }
}