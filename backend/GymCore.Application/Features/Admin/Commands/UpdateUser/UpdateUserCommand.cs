using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.UpdateUser
{
    public record UpdateUserCommand(Guid UserId, string Email, string FirstName, string LastName, string? NewPassword) : IRequest;

    public class UpdateUserCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher) : IRequestHandler<UpdateUserCommand>
    {
        public async Task Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .Include(u => u.Details)
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null) throw new Exception("User not found.");

            // Change email (if different)
            if (user.Email != request.Email)
            {
                var emailExists = await context.Users.AnyAsync(u => u.Email == request.Email && u.Id != request.UserId, cancellationToken);
                if (emailExists) throw new Exception("Email is already taken by another user.");
                user.ChangeEmail(request.Email);
            }
            
            // If the admin entered a new password - we hash it and change it
            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                var newHash = passwordHasher.Hash(request.NewPassword);
                user.ChangePassword(newHash);
            }
            
            user.Details.UpdateProfile(request.FirstName, request.LastName, user.Details.AvatarUrl, user.Details.Bio);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}