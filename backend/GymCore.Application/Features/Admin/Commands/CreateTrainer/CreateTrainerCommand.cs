using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.CreateTrainer
{
    public record CreateTrainerCommand(
        string Email, 
        string Password, 
        string FirstName, 
        string LastName) : IRequest<Guid>;

    public class CreateTrainerCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
        : IRequestHandler<CreateTrainerCommand, Guid>
    {
        public async Task<Guid> Handle(CreateTrainerCommand request, CancellationToken cancellationToken)
        {
            var emailExists = await context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken);
            if (emailExists) throw new Exception("Email already exists in the system."); 

            // Hashing the temporary password
            var hashedPassword = passwordHasher.Hash(request.Password);

            // We forcefully pass UserRole.Coach to the constructor
            var user = new User(request.Email, hashedPassword, UserRole.Coach);

            var userDetails = new UserDetails(user.Id, request.FirstName, request.LastName);

            context.Users.Add(user);
            context.UserDetails.Add(userDetails);

            await context.SaveChangesAsync(cancellationToken);

            return user.Id;
        }
    }
}