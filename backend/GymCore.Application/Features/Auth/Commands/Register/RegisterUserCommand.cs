using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Auth.Commands.Register
{
    // What do we want to do? (We return the Guid - i.e. the ID of the newly created user)
    public record RegisterUserCommand(
        string Email, 
        string Password,
        string FirstName, 
        string LastName) : IRequest<Guid>;

    // How do we execute the command?
    public class RegisterUserCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
        : IRequestHandler<RegisterUserCommand, Guid>
    {
        // Injecting our database context and password hasher

        public async Task<Guid> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            // Check if email already exists
            var emailExists = await context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken);
            if (emailExists)
            {
                // We will upgrade this to a custom ValidationException soon, but this is a solid start
                throw new Exception("Email already exists in the system."); 
            }
            
            // Hashing the password
            var hashedPassword = passwordHasher.Hash(request.Password);

            // Create the domain entity with the securely hashed password
            var user = new User(request.Email, hashedPassword);

            // Create related details
            var userDetails = new UserDetails(user.Id, request.FirstName, request.LastName);

            context.Users.Add(user);
            context.UserDetails.Add(userDetails);

            // Save transaction to PostgreSQL
            await context.SaveChangesAsync(cancellationToken);

            return user.Id;
        }
    }
}