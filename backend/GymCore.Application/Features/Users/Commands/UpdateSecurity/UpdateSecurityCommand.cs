using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Users.Commands.UpdateSecurity
{
    public record UpdateSecurityCommand(string Email, string CurrentPassword, string? NewPassword, Guid UserId = default) : IRequest;

    public class UpdateSecurityCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher) : IRequestHandler<UpdateSecurityCommand>
    {
        public async Task Handle(UpdateSecurityCommand request, CancellationToken cancellationToken)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null) throw new Exception("User not found.");

            // Verify your identity with your current password
            if (!passwordHasher.Verify(user.PasswordHash, request.CurrentPassword))
                throw new Exception("Invalid current password.");

            // Email Update
            if (user.Email != request.Email)
            {
                var emailTaken = await context.Users.AnyAsync(u => u.Email == request.Email && u.Id != request.UserId, cancellationToken);
                if (emailTaken) throw new Exception("Email already in use.");
                user.ChangeEmail(request.Email);
            }

            // Optional password change to a new one
            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                user.ChangePassword(passwordHasher.Hash(request.NewPassword));
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}