using GymCore.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Application.Features.Users.Queries.GetMyProfile
{
    // DTO carrying all user data for the frontend form
    public record MyProfileDto(
        Guid Id,
        string Email,
        string FirstName,
        string LastName,
        string? AvatarUrl,
        string? Bio,
        decimal? Weight,
        decimal? Height);

    public record GetMyProfileQuery(Guid UserId) : IRequest<MyProfileDto>;

    public class GetMyProfileQueryHandler(IApplicationDbContext context) : IRequestHandler<GetMyProfileQuery, MyProfileDto>
    {
        public async Task<MyProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .Include(u => u.Details)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null) throw new Exception("User not found.");

            return new MyProfileDto(
                user.Id,
                user.Email,
                user.Details.FirstName,
                user.Details.LastName,
                user.Details.AvatarUrl,
                user.Details.Bio,
                user.Details.Weight,
                user.Details.Height
            );
        }
    }
}