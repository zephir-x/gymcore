namespace GymCore.Domain.Enums
{
    public enum ReservationStatus
    {
        Confirmed = 0, // Successfully booked a spot in the class
        Waitlist = 1,  // The class is full, user is waiting for someone to drop out
        Cancelled = 2  // User manually backed out of the class
    }
}