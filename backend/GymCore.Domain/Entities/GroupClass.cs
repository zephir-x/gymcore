using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class GroupClass : Entity
    {
        public string Name { get; private set; }
        
        // Foreign keys linking to the coach leading the class and the physical room
        public Guid CoachId { get; private set; }
        public Guid RoomId { get; private set; }
        
        public DateTime StartTime { get; private set; }
        public DateTime EndTime { get; private set; }
        
        // Hard limit on how many people can attend
        // Important: Business logic must ensure this doesn't exceed the Room's MaxCapacity
        public int MaxAttendees { get; private set; }
        
        // Flag that tells if the classes are cancelled by admin or not
        public bool IsCancelled { get; private set; } = false;
        
        // Navigation properties for EF Core relationship mapping
        public User Coach { get; private set; }
        public Room Room { get; private set; }

        // Private backing field for reservations to protect the collection
        private readonly List<ClassReservation> _reservations = new();
        
        // Public read-only access for EF Core and our business logic
        public IReadOnlyCollection<ClassReservation> Reservations => _reservations.AsReadOnly();
        
        protected GroupClass() { }

        public GroupClass(string name, Guid coachId, Guid roomId, DateTime startTime, DateTime endTime, int maxAttendees)
        {
            Name = name;
            CoachId = coachId;
            RoomId = roomId;
            StartTime = startTime;
            EndTime = endTime;
            MaxAttendees = maxAttendees;
        }

        public void UpdateSchedule(DateTime startTime, DateTime endTime)
        {
            StartTime = startTime;
            EndTime = endTime;
            Update(); // Updates the UpdatedAt timestamp from the base Entity class
        }
        
        public void UpdateDetails(string name, Guid roomId, int maxAttendees)
        {
            Name = name;
            RoomId = roomId;
            MaxAttendees = maxAttendees;
            Update();
        }

        public void CancelClass()
        {
            IsCancelled = true;
            Update();
        }
    }
}