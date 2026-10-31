using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Entities;

namespace CrystalPharm.Booking.Application.Services;

public sealed class VisitorAppointmentService(
    IStaffAvailabilityReader staffAvailabilityReader,
    IAppointmentRepository appointmentRepository,
    IAppointmentService appointmentService,
    TimeProvider timeProvider) : IVisitorAppointmentService
{
    private static readonly TimeSpan SlotDuration = TimeSpan.FromMinutes(20);
    private static readonly TimeZoneInfo PharmacyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Paris");

    public async Task<IReadOnlyList<AvailableAppointmentSlotDto>> ListAvailableSlotsAsync(
        DateOnly day,
        CancellationToken cancellationToken)
    {
        var freeSlots = await ListFreeSlotsAsync(day, cancellationToken);
        return freeSlots.Select(slot => new AvailableAppointmentSlotDto(
            slot.Encode(),
            ToInstant(slot.Day, slot.StartTime),
            ToInstant(slot.Day, slot.EndTime))).ToArray();
    }

    public async Task<VisitorAppointmentResult> RequestAsync(
        VisitorAppointmentRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!AppointmentSlotId.TryDecode(request.SlotId, out var requestedSlot))
        {
            return VisitorAppointmentResult.SlotUnavailable;
        }

        // Le planning a pu changer depuis la liste affichée : on relit juste avant d'écrire.
        var freeSlots = await ListFreeSlotsAsync(requestedSlot.Day, cancellationToken);
        if (!freeSlots.Contains(requestedSlot))
        {
            return VisitorAppointmentResult.SlotUnavailable;
        }

        var schedulingResult = await appointmentService.ScheduleAsync(
            new NewAppointmentDto(
                requestedSlot.EmployeeId,
                requestedSlot.Day,
                requestedSlot.StartTime,
                requestedSlot.EndTime,
                $"{request.FirstName.Trim()} {request.LastName.Trim()}",
                request.Phone,
                request.Reason),
            cancellationToken);

        return schedulingResult is AppointmentSchedulingResult.Scheduled
            ? VisitorAppointmentResult.Requested
            : VisitorAppointmentResult.SlotUnavailable;
    }

    private async Task<IReadOnlyList<AppointmentSlotId>> ListFreeSlotsAsync(DateOnly day, CancellationToken cancellationToken)
    {
        var now = TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), PharmacyTimeZone);
        if (day < DateOnly.FromDateTime(now.DateTime))
        {
            return [];
        }

        var windows = await staffAvailabilityReader.ListOfDayAsync(day, cancellationToken);
        var takenAppointments = (await appointmentRepository.ListOfDaysAsync([day], cancellationToken))
            .Where(appointment => appointment.Status != AppointmentStatus.Cancelled)
            .ToArray();

        return windows
            .SelectMany(CutIntoSlots)
            .Where(slot => ToInstant(slot.Day, slot.StartTime) > now)
            .Where(slot => !takenAppointments.Any(appointment => IsOverlapping(appointment, slot)))
            .OrderBy(slot => slot.StartTime)
            .ThenBy(slot => slot.EmployeeId)
            .ToArray();
    }

    private static IEnumerable<AppointmentSlotId> CutIntoSlots(StaffAvailabilityWindow window)
    {
        for (var start = window.StartTime; start.Add(SlotDuration) <= window.EndTime && start.Add(SlotDuration) > start; start = start.Add(SlotDuration))
        {
            yield return new AppointmentSlotId(window.EmployeeId, window.Day, start, start.Add(SlotDuration));
        }
    }

    private static bool IsOverlapping(Appointment appointment, AppointmentSlotId slot) =>
        appointment.EmployeeId == slot.EmployeeId
        && appointment.StartTime < slot.EndTime
        && slot.StartTime < appointment.EndTime;

    private static DateTimeOffset ToInstant(DateOnly day, TimeOnly timeOfDay)
    {
        var wallClock = day.ToDateTime(timeOfDay);
        return new DateTimeOffset(wallClock, PharmacyTimeZone.GetUtcOffset(wallClock));
    }
}
