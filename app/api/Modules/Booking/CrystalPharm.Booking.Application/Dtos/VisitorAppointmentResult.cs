namespace CrystalPharm.Booking.Application.Dtos;

public enum VisitorAppointmentResult
{
    Requested,

    /// <summary>Le créneau n'existe plus, est déjà pris, ou est passé.</summary>
    SlotUnavailable,
}
