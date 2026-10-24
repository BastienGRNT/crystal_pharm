namespace CrystalPharm.Booking.Application.Dtos;

public abstract record AppointmentSchedulingResult
{
    private AppointmentSchedulingResult()
    {
    }

    public sealed record Scheduled(AppointmentDto Appointment) : AppointmentSchedulingResult;

    /// <summary>L'Employee a déjà un rendez-vous qui chevauche ce créneau.</summary>
    public sealed record SlotAlreadyTaken : AppointmentSchedulingResult;
}
