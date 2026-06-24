using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Queries.GetRooms
{
    public record RoomDto(Guid Id, string Name, int MaxCapacity, Guid? RequiredTierId, string? RequiredTierName, string? ImageUrl, string? Description);

    public record GetRoomsQuery() : IRequest<List<RoomDto>>;

    public class GetRoomsQueryHandler(IApplicationDbContext context) : IRequestHandler<GetRoomsQuery, List<RoomDto>>
    {
        public async Task<List<RoomDto>> Handle(GetRoomsQuery request, CancellationToken cancellationToken)
        {
            return await context.Rooms
                .AsNoTracking()
                .Include(r => r.RequiredTier)
                .Select(r => new RoomDto(
                    r.Id,
                    r.Name,
                    r.MaxCapacity,
                    r.RequiredTierId,
                    r.RequiredTier != null ? r.RequiredTier.Name : null,
                    r.ImageUrl,
                    r.Description
                ))
                .ToListAsync(cancellationToken);
        }
    }
}