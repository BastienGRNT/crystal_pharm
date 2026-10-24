using CrystalPharm.Booking.Domain.ValueObjects;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Booking.Domain.Entities;

/// <summary>Un rendez-vous d'un patient avec un Employee de la pharmacie. Donnée de santé.</summary>
public sealed class Appointment : ITenantOwned
{
    public const int MaximumReasonLength = 100;

    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public DateOnly Day { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public string PatientName { get; private set; }
    public string PatientPhone { get; private set; }
    public string Reason { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    // Pour EF Core, qui remplit les propriétés à la lecture.
    private Appointment()
    {
        PatientName = string.Empty;
        PatientPhone = string.Empty;
        Reason = string.Empty;
    }

    private Appointment(Guid employeeId, AppointmentSlot slot, PatientContact patient, string reason, DateTimeOffset createdAt)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        Day = slot.Day;
        StartTime = slot.StartTime;
        EndTime = slot.EndTime;
        PatientName = patient.Name;
        PatientPhone = patient.Phone;
        Reason = reason;
        Status = AppointmentStatus.Pending;
        CreatedAt = createdAt;
    }

    /// <summary>Un nouveau rendez-vous, en attente de confirmation par la pharmacie.</summary>
    public static Appointment Schedule(
        Guid employeeId,
        AppointmentSlot slot,
        PatientContact patient,
        string reason,
        DateTimeOffset createdAt)
    {
        if (employeeId == Guid.Empty)
        {
            throw new InvalidAppointmentException("Choisissez la personne de l’équipe qui reçoit le patient.");
        }

        var trimmedReason = reason.Trim();
        if (trimmedReason.Length == 0 || trimmedReason.Length > MaximumReasonLength)
        {
            throw new InvalidAppointmentException($"Le motif est obligatoire, {MaximumReasonLength} caractères au plus.");
        }

        return new Appointment(employeeId, slot, patient, trimmedReason, createdAt);
    }

    /// <returns><c>false</c> si le rendez-vous n'était plus en attente.</returns>
    public bool Confirm()
    {
        if (Status != AppointmentStatus.Pending)
        {
            return false;
        }

        Status = AppointmentStatus.Confirmed;
        return true;
    }

    /// <returns><c>false</c> si le rendez-vous était déjà annulé.</returns>
    public bool Cancel()
    {
        if (Status == AppointmentStatus.Cancelled)
        {
            return false;
        }

        Status = AppointmentStatus.Cancelled;
        return true;
    }
}
