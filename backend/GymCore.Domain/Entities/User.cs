using GymCore.Domain.Common;
using GymCore.Domain.Enums;

namespace GymCore.Domain.Entities
{
    public class User : Entity
    {
        public string Email { get; private set; }
        public string PasswordHash { get; private set; }
        public UserRole Role { get; private set; }
        
        public bool IsActive { get; private set; } = true;
        
        public UserDetails Details { get; private set; }
        
        // EF Core needs a parameterless constructor to do its reflection magic when fetching from DB
        protected User() { }

        public User(string email, string passwordHash, UserRole role = UserRole.Member)
        {
            Email = email;
            PasswordHash = passwordHash;
            Role = role;
        }
        
        public void ChangePassword(string newPasswordHash)
        {
            PasswordHash = newPasswordHash;
            Update(); // Triggers the UpdatedAt timestamp from the base class
        }
        
        public void ChangeEmail(string newEmail)
        {
            Email = newEmail;
            Update();
        }
        
        public void ChangeRole(UserRole newRole)
        {
            Role = newRole;
            Update();
        }
        
        public void ToggleActiveStatus()
        {
            IsActive = !IsActive;
            Update();
        }
    }
}