namespace GymCore.Application.Features.Bookings.Queries.GetUserReservations
{
    // A lightweight object to return the user's booking details
    public record UserReservationDto(
        Guid ReservationId,
        Guid ClassId,
        string ClassName,
        DateTime StartTime,
        DateTime EndTime,
        string Status
    );
}