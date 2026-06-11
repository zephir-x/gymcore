using System;
using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class Room : Entity
    {
        public string Name { get; private set; }
        
        // Crucial for validating if a group class doesn't exceed room limits
        public int MaxCapacity { get; private set; } 
        
        // Nullable means the room has no tier restrictions - open to all active members by default
        public Guid? RequiredTierId { get; private set; } 
        
        public SubscriptionTier? RequiredTier { get; private set; }

        protected Room() { }

        public Room(string name, int maxCapacity, Guid? requiredTierId = null)
        {
            Name = name;
            MaxCapacity = maxCapacity;
            RequiredTierId = requiredTierId;
        }

        public void UpdateDetails(string name, int maxCapacity, Guid? requiredTierId)
        {
            Name = name;
            MaxCapacity = maxCapacity;
            RequiredTierId = requiredTierId;
            Update();
        }
    }
}