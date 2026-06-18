using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Commands.DeleteGroupClass
{
    public record DeleteGroupClassCommand(Guid ClassId) : IRequest;

    public class DeleteGroupClassCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteGroupClassCommand>
    {
        public async Task Handle(DeleteGroupClassCommand request, CancellationToken cancellationToken)
        {
            var groupClass = await context.GroupClasses.FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

            if (groupClass == null) throw new Exception("Class not found.");
            if (groupClass.IsCancelled) throw new Exception("Class is already cancelled.");
            
            groupClass.CancelClass();
            
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}