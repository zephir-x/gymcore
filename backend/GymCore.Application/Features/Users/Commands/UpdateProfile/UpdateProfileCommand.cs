using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Users.Commands.UpdateProfile
{
    // Record properties match what we expect from the frontend JSON
    public record UpdateProfileCommand(
        string FirstName, 
        string LastName, 
        string? AvatarUrl, 
        string? Bio,
        Guid UserId = default) : IRequest;

    public class UpdateProfileCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateProfileCommand>
    {
        public async Task Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .Include(u => u.Details)
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null) throw new Exception("User not found.");

            // We update the profile using our Domain method
            user.Details.UpdateProfile(
                request.FirstName, 
                request.LastName, 
                request.AvatarUrl, 
                request.Bio);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}