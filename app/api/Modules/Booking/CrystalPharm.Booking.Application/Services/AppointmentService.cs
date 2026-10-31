using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.Booking.Domain.ValueObjects;

namespace CrystalPharm.Booking.Application.Services;

public sealed class AppointmentService(
    IAppointmentRepository appointmentRepository,
    IHealthDataAccessLog healthDataAccessLog,
    TimeProvider timeProvider) : IAppointmentService
{
    public async Task<IReadOnlyList<AppointmentDto>> ListOfDaysAsync(
        IReadOnlyCollection<DateOnly> days,
        CancellationToken cancellationToken)
    {
        var appointments = await appointmentRepository.ListOfDaysAsync(days, cancellationToken);
        await healthDataAccessLog.RecordAsync("appointments.list", appointments.Select(appointment => appointment.Id).ToArray(), cancellationToken);
        return appointments.Select(AppointmentDto.From).ToArray();
    }

    public async Task<AppointmentDto?> FindAsync(Guid appointmentId, CancellationToken cancellationToken)
    {
        var appointment = await appointmentRepository.FindAsync(appointmentId, cancellationToken);
        if (appointment is null)
        {
            return null;
        }

        await healthDataAccessLog.RecordAsync("appointments.read", [appointment.Id], cancellationToken);
        return AppointmentDto.From(appointment);
    }

    public async Task<AppointmentSchedulingResult> ScheduleAsync(
        NewAppointmentDto newAppointment,
        CancellationToken cancellationToken)
    {
        var appointment = Appointment.Schedule(
            newAppointment.EmployeeId,
            new AppointmentSlot(newAppointment.Day, newAppointment.StartTime, newAppointment.EndTime),
            new PatientContact(newAppointment.PatientName, newAppointment.PatientPhone),
            newAppointment.Reason,
            timeProvider.GetUtcNow(),
            newAppointment.ReasonId,
            newAppointment.Note);
        if (newAppointment.ConfirmImmediately)
        {
            appointment.Confirm();
        }

        appointmentRepository.Add(appointment);
        try
        {
            await appointmentRepository.SaveChangesAsync(cancellationToken);
        }
        catch (AppointmentSlotAlreadyTakenException)
        {
            return new AppointmentSchedulingResult.SlotAlreadyTaken();
        }

        return new AppointmentSchedulingResult.Scheduled(AppointmentDto.From(appointment));
    }

    public Task<bool> ConfirmAsync(Guid appointmentId, CancellationToken cancellationToken) =>
        ChangeStatusAsync(appointmentId, appointment => appointment.Confirm(), cancellationToken);

    public Task<bool> CancelAsync(Guid appointmentId, CancellationToken cancellationToken) =>
        ChangeStatusAsync(appointmentId, appointment => appointment.Cancel(), cancellationToken);

    private async Task<bool> ChangeStatusAsync(
        Guid appointmentId,
        Func<Appointment, bool> changeStatus,
        CancellationToken cancellationToken)
    {
        var appointment = await appointmentRepository.FindAsync(appointmentId, cancellationToken);
        if (appointment is null || !changeStatus(appointment))
        {
            return false;
        }

        await appointmentRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
