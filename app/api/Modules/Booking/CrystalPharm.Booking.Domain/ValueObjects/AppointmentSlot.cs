namespace CrystalPharm.Booking.Domain.ValueObjects;

/// <summary>Un jour et une plage horaire dans ce jour, la fin après le début.</summary>
public sealed record AppointmentSlot
{
    public DateOnly Day { get; }
    public TimeOnly StartTime { get; }
    public TimeOnly EndTime { get; }

    public AppointmentSlot(DateOnly day, TimeOnly startTime, TimeOnly endTime)
    {
        if (endTime <= startTime)
        {
            throw new InvalidAppointmentException("La fin du rendez-vous doit venir après son début.");
        }

        Day = day;
        StartTime = startTime;
        EndTime = endTime;
    }
}
