namespace GymCore.Domain.Enums
{
    public enum SlotStatus
    {
        Available = 0, // Open for anyone to book
        Booked = 1,    // A member has reserved this time
        Completed = 2, // The training session happened successfully
        Cancelled = 3  // Either the coach took a day off, or the member bailed
    }
}