using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Configuration;
using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.Booking.Domain.Scheduling;

namespace CrystalPharm.Booking.Application.Services;

public sealed class VisitorAppointmentService(
    IAppointmentConfigurationRepository configurationRepository,
    IStaffAvailabilityReader staffAvailabilityReader,
    IAppointmentRepository appointmentRepository,
    IAppointmentService appointmentService,
    TimeProvider timeProvider) : IVisitorAppointmentService
{
    private static readonly TimeZoneInfo PharmacyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Paris");

    public async Task<VisitorAppointmentOptionsDto> GetOptionsAsync(CancellationToken cancellationToken)
    {
        var configuration = await configurationRepository.GetAsync(cancellationToken);
        return new VisitorAppointmentOptionsDto(
            configuration.Settings.IsBookingOpen,
            configuration.Settings.MaximumAdvanceDays,
            configuration.Reasons
                .Where(reason => reason.IsActive)
                .Select(reason => new VisitorAppointmentReasonDto(reason.Id, reason.Label, reason.Description, reason.PreparationNote, reason.DurationMinutes))
                .ToArray());
    }

    public async Task<IReadOnlyList<AvailableAppointmentDayDto>> ListAvailableDaysAsync(
        Guid reasonId,
        DateOnly firstDay,
        DateOnly lastDay,
        CancellationToken cancellationToken)
    {
        var configuration = await configurationRepository.GetAsync(cancellationToken);
        var reason = configuration.FindActiveReason(reasonId);
        if (reason is null || lastDay < firstDay || lastDay.DayNumber - firstDay.DayNumber >= IVisitorAppointmentService.MaximumDaysPerAvailabilityListing)
        {
            return [];
        }

        var freeSlots = await PlanPeriodAsync(configuration, reason, firstDay, lastDay, cancellationToken);
        return freeSlots
            .GroupBy(slot => slot.Day)
            .OrderBy(slotsOfDay => slotsOfDay.Key)
            .Select(slotsOfDay => new AvailableAppointmentDayDto(slotsOfDay.Key, slotsOfDay.Select(slot => slot.StartTime).Distinct().Count()))
            .ToArray();
    }

    public async Task<IReadOnlyList<AvailableAppointmentSlotDto>> ListAvailableSlotsAsync(
        Guid reasonId,
        DateOnly day,
        CancellationToken cancellationToken)
    {
        var configuration = await configurationRepository.GetAsync(cancellationToken);
        var reason = configuration.FindActiveReason(reasonId);
        if (reason is null)
        {
            return [];
        }

        var freeSlots = await PlanPeriodAsync(configuration, reason, day, day, cancellationToken);
        return freeSlots
            .DistinctBy(slot => slot.StartTime)
            .Select(slot => new AvailableAppointmentSlotDto(
                new AppointmentSlotId(slot.Day, slot.StartTime, slot.EndTime).Encode(),
                ToInstant(slot.Day, slot.StartTime),
                ToInstant(slot.Day, slot.EndTime)))
            .ToArray();
    }

    public async Task<VisitorAppointmentResult> RequestAsync(VisitorAppointmentRequestDto request, CancellationToken cancellationToken)
    {
        var configuration = await configurationRepository.GetAsync(cancellationToken);
        var reason = configuration.FindActiveReason(request.ReasonId);
        if (reason is null)
        {
            return new VisitorAppointmentResult.ReasonUnavailable();
        }

        if (!AppointmentSlotId.TryDecode(request.SlotId, out var requestedSlot))
        {
            return new VisitorAppointmentResult.SlotUnavailable();
        }

        // Le planning a pu changer depuis la liste affichée : on relit juste avant d'écrire, puis on essaie
        // chaque personne libre à tour de rôle, car la base refuse la double réservation même simultanée.
        var candidates = (await PlanPeriodAsync(configuration, reason, requestedSlot.Day, requestedSlot.Day, cancellationToken))
            .Where(slot => slot.StartTime == requestedSlot.StartTime && slot.EndTime == requestedSlot.EndTime)
            .ToArray();

        foreach (var candidate in candidates)
        {
            var schedulingResult = await appointmentService.ScheduleAsync(
                new NewAppointmentDto(
                    candidate.EmployeeId,
                    candidate.Day,
                    candidate.StartTime,
                    candidate.EndTime,
                    $"{request.FirstName.Trim()} {request.LastName.Trim()}",
                    request.Phone,
                    reason.Label,
                    reason.Id,
                    request.Note,
                    configuration.Settings.ConfirmsAutomatically),
                cancellationToken);

            if (schedulingResult is AppointmentSchedulingResult.Scheduled scheduled)
            {
                return new VisitorAppointmentResult.Requested(new VisitorAppointmentConfirmationDto(
                    ToInstant(candidate.Day, candidate.StartTime),
                    ToInstant(candidate.Day, candidate.EndTime),
                    reason.Label,
                    scheduled.Appointment.Status == AppointmentStatus.Confirmed,
                    configuration.Settings.ConfirmationMessage));
            }
        }

        return new VisitorAppointmentResult.SlotUnavailable();
    }

    private async Task<IReadOnlyList<PlannedSlot>> PlanPeriodAsync(
        AppointmentConfiguration configuration,
        AppointmentReason reason,
        DateOnly firstDay,
        DateOnly lastDay,
        CancellationToken cancellationToken)
    {
        var now = TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), PharmacyTimeZone).DateTime;
        var days = Enumerable.Range(0, lastDay.DayNumber - firstDay.DayNumber + 1).Select(firstDay.AddDays).ToArray();
        var openDays = days.Where(day => FreeSlotPlanner.IsDayOpenForBooking(day, configuration, now)).ToArray();
        if (openDays.Length == 0)
        {
            return [];
        }

        var windows = FreeSlotPlanner
            .ExpandWeeklyAvailability(configuration.WeeklyAvailability, firstDay, lastDay)
            .Concat(await staffAvailabilityReader.ListOfPeriodAsync(firstDay, lastDay, cancellationToken))
            .ToArray();
        var bookedPeriods = (await appointmentRepository.ListOfDaysAsync(openDays, cancellationToken))
            .Where(appointment => appointment.Status != AppointmentStatus.Cancelled)
            .Select(appointment => new BookedPeriod(appointment.EmployeeId, appointment.Day, appointment.StartTime, appointment.EndTime))
            .ToArray();

        return openDays
            .SelectMany(day => FreeSlotPlanner.PlanDay(day, reason, configuration, windows, bookedPeriods, now))
            .ToArray();
    }

    private static DateTimeOffset ToInstant(DateOnly day, TimeOnly timeOfDay)
    {
        var wallClock = day.ToDateTime(timeOfDay);
        return new DateTimeOffset(wallClock, PharmacyTimeZone.GetUtcOffset(wallClock));
    }
}
