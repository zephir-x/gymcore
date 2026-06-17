using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.ToggleUserStatus
{
    public record ToggleUserStatusCommand(Guid UserId) : IRequest;

    public class ToggleUserStatusCommandHandler(IApplicationDbContext context) : IRequestHandler<ToggleUserStatusCommand>
    {
        public async Task Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null) throw new Exception("User not found.");

            user.ToggleActiveStatus();
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}