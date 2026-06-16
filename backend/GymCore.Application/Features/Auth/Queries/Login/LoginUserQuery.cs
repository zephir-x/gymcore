using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Auth.Queries.Login
{
    // The result object containing both the user ID and the JWT
    public record AuthResult(Guid UserId, string Token);

    // What are we asking for?
    public record LoginUserQuery(string Email, string Password) : IRequest<AuthResult>;

    // How do we process the login?
    public class LoginUserQueryHandler(IApplicationDbContext context, IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator) : IRequestHandler<LoginUserQuery, AuthResult>
    {
        public async Task<AuthResult> Handle(LoginUserQuery request, CancellationToken cancellationToken)
        {
            // Check if user exists in database
            var user = await context.Users.Include(u => u.Details).FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            // We intentionally throw a generic message so attackers don't know if the email exists
            if (user == null)
            {
                throw new Exception("Invalid email or password.");
            }

            // Verify password hash
            var isPasswordValid = passwordHasher.Verify(user.PasswordHash, request.Password);

            if (!isPasswordValid)
            {
                throw new Exception("Invalid email or password.");
            }

            // Generate JWT Token
            var token = jwtTokenGenerator.GenerateToken(user);

            // Return the DTO
            return new AuthResult(user.Id, token);
        }
    }
}