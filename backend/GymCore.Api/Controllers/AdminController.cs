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
        [HttpPost("rooms")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomCommand command)
        {
            var roomId = await sender.Send(command);
            
            return Ok(new { Message = "Room created successfully.", RoomId = roomId });
        }
    }
}