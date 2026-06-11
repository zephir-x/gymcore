using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Auth.Commands.Register
{
    // 1. What do we want to do? (We return the Guid - i.e. the ID of the newly created user)
    public record RegisterUserCommand(
        string Email, 
        string Password,
        string FirstName, 
        string LastName) : IRequest<Guid>;

    // 2. How do we execute the command?
    public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        // Injecting our database context and password hasher
        public RegisterUserCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<Guid> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            // Check if email already exists
            var emailExists = await _context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken);
            if (emailExists)
            {
                // We will upgrade this to a custom ValidationException soon, but this is a solid start
                throw new Exception("Email already exists in the system."); 
            }
            
            // Hashing the password
            var hashedPassword = _passwordHasher.Hash(request.Password);

            // Create the domain entity with the securely hashed password
            var user = new User(request.Email, hashedPassword, UserRole.Member);

            // Create related details
            var userDetails = new UserDetails(user.Id, request.FirstName, request.LastName);

            _context.Users.Add(user);
            _context.UserDetails.Add(userDetails);

            // Save transaction to PostgreSQL
            await _context.SaveChangesAsync(cancellationToken);

            return user.Id;
        }
    }
}