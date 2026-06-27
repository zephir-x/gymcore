using GymCore.Domain.Common;
using GymCore.Domain.Enums;

namespace GymCore.Domain.Entities
{
    public class UserSubscription : Entity
    {
        public Guid UserId { get; private set; }
        public Guid TierId { get; private set; }
        
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }
        public SubscriptionStatus Status { get; private set; }
        public string? PaymentIntentId { get; private set; }
        
        // Navigation properties
        public User User { get; private set; }
        public SubscriptionTier Tier { get; private set; }

        protected UserSubscription() { }

        public UserSubscription(Guid userId, Guid tierId, DateTime startDate, DateTime endDate, string? paymentIntentId = null)
        {
            UserId = userId;
            TierId = tierId;
            StartDate = startDate;
            EndDate = endDate;
            Status = SubscriptionStatus.Active;
            PaymentIntentId = paymentIntentId;
        }

        // Domain logic for handling state changes
        public void Cancel()
        {
            // We can only cancel if it is not already canceled (or possibly expired)
            if (Status != SubscriptionStatus.Cancelled && Status != SubscriptionStatus.Expired)
            {
                Status = SubscriptionStatus.Cancelled;
                EndDate = DateTime.UtcNow; // Immediate access cut-off
                Update();
            }
        }
        
        public void Expire()
        {
            Status = SubscriptionStatus.Expired;
            Update();
        }
    }
}