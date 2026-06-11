using GymCore.Application.Features.Auth.Commands.Register;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Automatically maps to "api/auth"
    public class AuthController : ControllerBase
    {
        private readonly ISender _sender; // ISender is the interface from MediatR used to send commands

        public AuthController(ISender sender)
        {
            _sender = sender;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserCommand command)
        {
            // Send the command to MediatR (which will route it to our Handler)
            var userId = await _sender.Send(command);
            
            // Return 200 OK with the new User's ID
            return Ok(new { UserId = userId });
        }
    }
}