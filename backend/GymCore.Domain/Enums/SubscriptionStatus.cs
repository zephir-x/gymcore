namespace GymCore.Domain.Enums
{
    public enum SubscriptionStatus
    {
        Active = 0,
        Frozen = 1,   // Used when a member temporarily pauses their membership
        Expired = 2,
        Cancelled = 3 // Manually cancelled before the natural end date
    }
}