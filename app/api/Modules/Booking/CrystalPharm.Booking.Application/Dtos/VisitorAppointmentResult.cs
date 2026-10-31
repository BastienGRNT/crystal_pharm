namespace CrystalPharm.Booking.Application.Dtos;

public abstract record VisitorAppointmentResult
{
    private VisitorAppointmentResult()
    {
    }

    public sealed record Requested(VisitorAppointmentConfirmationDto Confirmation) : VisitorAppointmentResult;

    /// <summary>Le créneau n'existe plus, est déjà pris, ou est passé.</summary>
    public sealed record SlotUnavailable : VisitorAppointmentResult;

    /// <summary>Le motif n'existe pas ou n'est plus proposé.</summary>
    public sealed record ReasonUnavailable : VisitorAppointmentResult;
}
