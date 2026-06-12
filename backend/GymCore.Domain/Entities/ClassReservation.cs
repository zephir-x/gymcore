using GymCore.Domain.Common;
using GymCore.Domain.Enums;

namespace GymCore.Domain.Entities
{
    public class ClassReservation : Entity
    {
        public Guid UserId { get; private set; }
        public Guid GroupClassId { get; private set; }
        
        public ReservationStatus Status { get; private set; }
        
        // Navigation properties
        public User User { get; private set; }
        public GroupClass GroupClass { get; private set; }

        protected ClassReservation() { }

        // By default, if there's room, we assume a Confirmed status upon creation
        public ClassReservation(Guid userId, Guid groupClassId, ReservationStatus initialStatus = ReservationStatus.Confirmed)
        {
            UserId = userId;
            GroupClassId = groupClassId;
            Status = initialStatus;
        }

        // Status transition methods ensure the state changes deliberately, not by random assignments from outside
        public void Cancel()
        {
            if (Status != ReservationStatus.Cancelled)
            {
                Status = ReservationStatus.Cancelled;
                Update();
            }
        }

        public void PromoteFromWaitlist()
        {
            // Only a waitlisted reservation can be promoted to a confirmed spot
            // (e.g., triggered by our background worker when someone else cancels)
            if (Status == ReservationStatus.Waitlist)
            {
                Status = ReservationStatus.Confirmed;
                Update();
            }
        }
    }
}