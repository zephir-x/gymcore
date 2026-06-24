using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class UserDetails : Entity
    {
        public Guid UserId { get; private set; }
        
        public string FirstName { get; private set; }
        public string LastName { get; private set; }
        
        public string? AvatarUrl { get; private set; }
        public string? Bio { get; private set; }
        
        public decimal? Weight { get; private set; }
        public decimal? Height { get; private set; }
        
        public User User { get; private set; }

        protected UserDetails() { }

        public UserDetails(Guid userId, string firstName, string lastName)
        {
            UserId = userId;
            FirstName = firstName;
            LastName = lastName;
        }
        
        public void UpdateProfile(string firstName, string lastName, string? avatar, string? bio)
        {
            FirstName = firstName;
            LastName = lastName;
            AvatarUrl = avatar;
            Bio = bio;
            Update(); 
        }
        
        public void UpdateMetrics(decimal? weight, decimal? height)
        {
            Weight = weight;
            Height = height;
            Update();
        }
    }
}