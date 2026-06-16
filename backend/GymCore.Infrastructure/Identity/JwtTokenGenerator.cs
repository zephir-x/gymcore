using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GymCore.Infrastructure.Identity
{
    // Concrete implementation generating JWT using standard .NET libraries
    public class JwtTokenGenerator(IConfiguration configuration) : IJwtTokenGenerator
    {
        public string GenerateToken(User user)
        {
            // Read settings from appsettings.json
            var secret = configuration["JwtSettings:Secret"]!;
            var issuer = configuration["JwtSettings:Issuer"];
            var audience = configuration["JwtSettings:Audience"];
            var expiryMinutes = int.Parse(configuration["JwtSettings:ExpiryMinutes"]!);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Claims are facts about the user embedded directly into the token
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role", user.Role.ToString()) // Very important for RBAC
            };

            if (user.Details != null)
            {
                claims.Add(new Claim("firstName", user.Details.FirstName));
            }
            
            var token = new JwtSecurityToken(
                issuer,
                audience,
                claims,
                expires: DateTime.Now.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}