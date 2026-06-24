using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class Room : Entity
    {
        public string Name { get; private set; }
        public int MaxCapacity { get; private set; }
        public string? ImageUrl { get; private set; }
        public string? Description { get; private set; }
        
        public Guid? RequiredTierId { get; private set; }
        public SubscriptionTier? RequiredTier { get; private set; }

        protected Room() { }

        public Room(string name, int maxCapacity, string? imageUrl = null, Guid? requiredTierId = null, string? description = null)
        {
            Name = name;
            MaxCapacity = maxCapacity;
            ImageUrl = imageUrl;
            RequiredTierId = requiredTierId;
            Description = description;
        }

        public void UpdateDetails(string name, int maxCapacity, string? imageUrl, Guid? requiredTierId, string? description)
        {
            Name = name;
            MaxCapacity = maxCapacity;
            ImageUrl = imageUrl;
            RequiredTierId = requiredTierId;
            Description = description;
            Update();
        }
    }
}