using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class Notification : Entity
    {
        public Guid UserId { get; private set; }
        public string Title { get; private set; }
        public string Message { get; private set; }
        public bool IsRead { get; private set; }
        
        // EF Core relation
        public User User { get; private set; }

        protected Notification() { }

        public Notification(Guid userId, string title, string message)
        {
            UserId = userId;
            Title = title;
            Message = message;
            IsRead = false;
        }

        public void MarkAsRead()
        {
            IsRead = true;
            Update(); // Method from the base Entity class that updates UpdatedAt
        }
    }
}