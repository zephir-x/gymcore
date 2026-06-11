using GymCore.Application.Common.Interfaces;

namespace GymCore.Infrastructure.Identity
{
    // Implementation of our application's hashing contract using BCrypt
    public class PasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            // Generates a secure salt and hashes the password automatically
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool Verify(string passwordHash, string inputPassword)
        {
            return BCrypt.Net.BCrypt.Verify(inputPassword, passwordHash);
        }
    }
}