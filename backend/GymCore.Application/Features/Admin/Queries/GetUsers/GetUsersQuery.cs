using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Admin.Queries.GetUsers
{
    public record UserDto(
        Guid Id, 
        string Email, 
        string FirstName, 
        string LastName, 
        string Role,
        bool IsActive,
        DateTime CreatedAt);

    public record GetUsersQuery(string? RoleFilter = null) : IRequest<List<UserDto>>;

    public class GetUsersQueryHandler(IApplicationDbContext context) : IRequestHandler<GetUsersQuery, List<UserDto>>
    {
        public async Task<List<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
        {
            var query = context.Users
                .Include(u => u.Details)
                .AsNoTracking()
                .AsQueryable();

            // If we sent a filter from the frontend, we use it
            if (!string.IsNullOrEmpty(request.RoleFilter))
            {
                // Converting a string "Member" / "Coach" to an enum
                if (Enum.TryParse<Domain.Enums.UserRole>(request.RoleFilter, true, out var roleEnum))
                {
                    query = query.Where(u => u.Role == roleEnum);
                }
            }

            return await query
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new UserDto(
                    u.Id,
                    u.Email,
                    u.Details != null ? u.Details.FirstName : "N/A",
                    u.Details != null ? u.Details.LastName : "N/A",
                    u.Role.ToString(),
                    u.IsActive,
                    u.CreatedAt
                ))
                .ToListAsync(cancellationToken);
        }
    }
}