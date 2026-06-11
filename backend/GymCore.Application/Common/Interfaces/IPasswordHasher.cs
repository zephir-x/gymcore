namespace GymCore.Application.Common.Interfaces
{
    // A simple contract for hashing and verifying passwords
    public interface IPasswordHasher
    {
        string Hash(string password);
        bool Verify(string passwordHash, string inputPassword);
    }
}