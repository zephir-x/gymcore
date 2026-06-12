using GymCore.Application.Features.Auth.Commands.Register;
using GymCore.Application.Features.Auth.Queries.Login;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Automatically maps to "api/auth"
    public class AuthController(ISender sender) : ControllerBase
    {
        // ISender is the interface from MediatR used to send commands

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserCommand command)
        {
            // Send the command to MediatR (which will route it to our Handler)
            var userId = await sender.Send(command);
            
            // Return 200 OK with the new User's ID
            return Ok(new { UserId = userId });
        }
        
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserQuery query)
        {
            var result = await sender.Send(query);
            return Ok(result);
        }
        
        // This endpoint is protected - requires a token
        [HttpGet("profile")]
        [Authorize] 
        public IActionResult GetProfile()
        {
            // We can easily extract e.g. ID from the token
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            return Ok(new { Message = "You managed to enter the section.", UserId = userId });
        }
    }
}