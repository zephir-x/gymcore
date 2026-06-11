using System;
using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class UserDetails : Entity
    {
        public Guid UserId { get; private set; }
        
        public string FirstName { get; private set; }
        public string LastName { get; private set; }
        
        // Nullable properties - user doesn't have to provide these right away
        public string? PhoneNumber { get; private set; }
        public string? AvatarUrl { get; private set; }
        
        public decimal? Weight { get; private set; }
        public decimal? Height { get; private set; }
        public decimal? BodyFatPercentage { get; private set; }
        
        public User User { get; private set; }

        protected UserDetails() { }

        public UserDetails(Guid userId, string firstName, string lastName)
        {
            UserId = userId;
            FirstName = firstName;
            LastName = lastName;
        }
        
        public void UpdateProfile(string firstName, string lastName, string? phone, string? avatar)
        {
            FirstName = firstName;
            LastName = lastName;
            PhoneNumber = phone;
            AvatarUrl = avatar;
            Update(); 
        }
        
        public void UpdateMetrics(decimal? weight, decimal? height, decimal? bodyFat)
        {
            Weight = weight;
            Height = height;
            BodyFatPercentage = bodyFat;
            Update();
        }
    }
}