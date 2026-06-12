using GymCore.Domain.Common;
using GymCore.Domain.Enums;

namespace GymCore.Domain.Entities
{
    public class TrainerSlot : Entity
    {
        // The coach offering the personal training
        public Guid CoachId { get; private set; }
        
        public DateTime StartTime { get; private set; }
        public DateTime EndTime { get; private set; }
        
        // Nullable because a slot starts as Available with no client attached to it yet
        public Guid? ClientId { get; private set; }
        
        public SlotStatus Status { get; private set; }
        
        // Navigation properties for EF Core
        public User Coach { get; private set; }
        public User? Client { get; private set; }

        protected TrainerSlot() { }

        // When a coach creates a slot, it's immediately available and has no client
        public TrainerSlot(Guid coachId, DateTime startTime, DateTime endTime)
        {
            if (endTime <= startTime)
                throw new ArgumentException("End time must be after start time.");
            
            CoachId = coachId;
            StartTime = startTime;
            EndTime = endTime;
            Status = SlotStatus.Available;
        }

        // Domain Logic Methods (State Machine)

        public void Book(Guid clientId)
        {
            // We can only book a slot that is currently open
            if (Status != SlotStatus.Available)
                throw new Exception("This slot is no longer available.");
            
            ClientId = clientId;
            Status = SlotStatus.Booked;
            Update();
        }

        public void Cancel()
        {
            // Both Available (coach takes a day off) and Booked (client/coach cancels) slots can be cancelled
            if (Status == SlotStatus.Cancelled || Status == SlotStatus.Completed)
                throw new Exception($"Cannot cancel a slot that is already {Status}.");
            
            Status = SlotStatus.Cancelled;
            // Note: We deliberately don't clear the ClientId here
            Update();
        }
        
        public void MarkAsCompleted()
        {
            if (Status != SlotStatus.Booked)
                throw new Exception("Only booked slots can be marked as completed.");
            
            Status = SlotStatus.Completed;
            Update();
        }
    }
}