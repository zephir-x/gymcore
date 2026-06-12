namespace GymCore.Application.Features.Bookings.Queries.GetAvailableClasses
{
    // Clean, lightweight object sent to Frontend
    public record GroupClassDto(
        Guid Id,
        string Name,
        DateTime StartTime,
        DateTime EndTime,
        int MaxAttendees,
        int CurrentBookings
    );
}