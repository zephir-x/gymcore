namespace GymCore.Domain.Common
{
    public abstract class Entity
    {
        // Generates a unique ID automatically upon instantiation so we don't have to pass it everywhere
        public Guid Id { get; protected set; } = Guid.NewGuid();
        
        // Always use UTC for dates to avoid timezone headaches across different servers/clients
        public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; protected set; }
        public DateTime? DeletedAt { get; protected set; }
        
        // Quick helper for soft deletes - we don't hard-delete records to preserve history
        public bool IsDeleted => DeletedAt.HasValue;
        
        public void Update() => UpdatedAt = DateTime.UtcNow;
        public void Delete() => DeletedAt = DateTime.UtcNow;
    }
}