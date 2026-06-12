namespace GymCore.Application.Features.Subscriptions.Queries.GetMySubscription
{
    public record MySubscriptionDto(
        Guid SubscriptionId, 
        string TierName, 
        DateTime StartDate, 
        DateTime EndDate, 
        string Status);
}