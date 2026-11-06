using CrystalPharm.Booking.Domain.Configuration;

namespace CrystalPharm.Booking.Domain.Scheduling;

/// <summary>
/// Découpe les plages d'un jour en créneaux pour un motif, en respectant les règles générales de la pharmacie
/// (fermetures, délais, pause entre deux rendez-vous) et les rendez-vous déjà pris.
/// </summary>
public static class FreeSlotPlanner
{
    /// <param name="now">L'heure actuelle dans le fuseau de la pharmacie.</param>
    /// <returns>Un créneau par couple (personne, début) libre, dans l'ordre du début puis de la personne.</returns>
    public static IReadOnlyList<PlannedSlot> PlanDay(
        DateOnly day,
        AppointmentReason reason,
        AppointmentConfiguration configuration,
        IReadOnlyCollection<AvailabilityWindow> windows,
        IReadOnlyCollection<BookedPeriod> bookedPeriods,
        DateTime now)
    {
        if (!IsDayOpenForBooking(day, configuration, now))
        {
            return [];
        }

        var settings = configuration.Settings;
        var earliestStart = now.AddMinutes(settings.MinimumNoticeMinutes);
        var duration = TimeSpan.FromMinutes(reason.DurationMinutes);
        var step = TimeSpan.FromMinutes(settings.SlotStepMinutes);
        var buffer = TimeSpan.FromMinutes(settings.BufferMinutes);

        return windows
            .Where(window => window.Day == day)
            .SelectMany(window => CutIntoSlots(window, duration, step))
            .Where(slot => day.ToDateTime(slot.StartTime) >= earliestStart)
            .Where(slot => !bookedPeriods.Any(booked => IsBlockedBy(booked, slot, buffer)))
            .OrderBy(slot => slot.StartTime)
            .ThenBy(slot => slot.EmployeeId)
            .ToArray();
    }

    public static bool IsDayOpenForBooking(DateOnly day, AppointmentConfiguration configuration, DateTime now)
    {
        var today = DateOnly.FromDateTime(now);
        return configuration.Settings.IsBookingOpen
            && day >= today
            && day <= today.AddDays(configuration.Settings.MaximumAdvanceDays)
            && !configuration.Closures.Any(closure => closure.Covers(day));
    }

    /// <summary>Les plages hebdomadaires de la pharmacie, posées sur chaque jour de la période.</summary>
    public static IEnumerable<AvailabilityWindow> ExpandWeeklyAvailability(
        IReadOnlyList<WeeklyAvailabilityWindow> weeklyAvailability,
        DateOnly firstDay,
        DateOnly lastDay)
    {
        for (var day = firstDay; day <= lastDay; day = day.AddDays(1))
        {
            var isoDayOfWeek = day.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)day.DayOfWeek;
            foreach (var window in weeklyAvailability.Where(window => window.IsoDayOfWeek == isoDayOfWeek))
            {
                yield return new AvailabilityWindow(window.EmployeeId, day, window.StartTime, window.EndTime);
            }
        }
    }

    private static IEnumerable<PlannedSlot> CutIntoSlots(AvailabilityWindow window, TimeSpan duration, TimeSpan step)
    {
        for (var start = window.StartTime; ; start = start.Add(step))
        {
            var end = start.Add(duration);
            // Au-delà de minuit, TimeOnly repart de zéro : la fin passerait avant le début.
            if (end <= start || end > window.EndTime)
            {
                yield break;
            }

            yield return new PlannedSlot(window.EmployeeId, window.Day, start, end);
        }
    }

    private static bool IsBlockedBy(BookedPeriod booked, PlannedSlot slot, TimeSpan buffer) =>
        booked.EmployeeId == slot.EmployeeId
        && booked.Day == slot.Day
        && booked.StartTime < slot.EndTime.Add(buffer)
        && slot.StartTime < booked.EndTime.Add(buffer);
}
