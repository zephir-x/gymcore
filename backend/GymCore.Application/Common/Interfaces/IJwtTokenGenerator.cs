using GymCore.Domain.Entities;

namespace GymCore.Application.Common.Interfaces
{
    // Interface specifying that we need a way to generate a token for a given User
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}