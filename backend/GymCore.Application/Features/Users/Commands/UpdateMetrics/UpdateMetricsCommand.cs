using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Users.Commands.UpdateMetrics
{
    public record UpdateMetricsCommand(
        decimal? Weight, 
        decimal? Height,
        Guid UserId = default) : IRequest;

    public class UpdateMetricsCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateMetricsCommand>
    {
        public async Task Handle(UpdateMetricsCommand request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .Include(u => u.Details)
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null) throw new Exception("User not found.");

            // Update purely the physical metrics
            user.Details.UpdateMetrics(request.Weight, request.Height);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}