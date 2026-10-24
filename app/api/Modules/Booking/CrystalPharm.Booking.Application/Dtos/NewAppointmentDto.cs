namespace CrystalPharm.Booking.Application.Dtos;

public sealed record NewAppointmentDto(
    Guid EmployeeId,
    DateOnly Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string PatientName,
    string PatientPhone,
    string Reason);
