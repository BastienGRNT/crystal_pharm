using CrystalPharm.Booking.Domain.Entities;

namespace CrystalPharm.Booking.Application.Dtos;

public sealed record AppointmentDto(
    Guid Id,
    Guid EmployeeId,
    DateOnly Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string PatientName,
    string PatientPhone,
    string Reason,
    AppointmentStatus Status,
    Guid? ReasonId = null,
    string? Note = null)
{
    public static AppointmentDto From(Appointment appointment) =>
        new(
            appointment.Id,
            appointment.EmployeeId,
            appointment.Day,
            appointment.StartTime,
            appointment.EndTime,
            appointment.PatientName,
            appointment.PatientPhone,
            appointment.Reason,
            appointment.Status,
            appointment.ReasonId,
            appointment.Note);
}
