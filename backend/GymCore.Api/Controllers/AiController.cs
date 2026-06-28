using GymCore.Application.Features.AI.Commands.ChatWithAi;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Anyone logged in (Member, Coach, Admin) can talk to AI
    public class AiController(ISender sender) : ControllerBase
    {
        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatWithAiCommand command)
        {
            // We expect the following object to come from React: { messages: [ { role: "user", content: "..." } ] }
            var reply = await sender.Send(command);
            return Ok(new { Reply = reply });
        }
    }
}