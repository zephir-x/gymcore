using System.Security.Claims;
using GymCore.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Api.Middleware
{
    public class ActiveUserCheckMiddleware(RequestDelegate next)
    {
        public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext)
        {
            // We check if the user is trying to use the token at all
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdString = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (Guid.TryParse(userIdString, out var userId))
                {
                    // Quick flag check in database
                    var isActive = await dbContext.Users
                        .Where(u => u.Id == userId)
                        .Select(u => u.IsActive)
                        .FirstOrDefaultAsync();

                    if (!isActive)
                    {
                        // User is banned -  we block the request and throw a 403 error
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(new { Message = "Account disabled. Please contact administration." });
                        return; // We terminate the flow - the query does not go further to the controllers
                    }
                }
            }

            // If it is active or it is a public request (e.g. login), we continue
            await next(context);
        }
    }
}