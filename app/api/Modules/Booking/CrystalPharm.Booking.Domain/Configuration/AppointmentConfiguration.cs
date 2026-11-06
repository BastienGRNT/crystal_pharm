namespace CrystalPharm.Booking.Domain.Configuration;

/// <summary>Tout ce que la pharmacie règle pour ses rendez-vous : motifs, horaires, fermetures et règles générales.</summary>
public sealed record AppointmentConfiguration
{
    public const int MaximumReasons = 30;
    public const int MaximumWeeklyWindows = 300;
    public const int MaximumClosures = 100;

    public AppointmentSettings Settings { get; }
    public IReadOnlyList<AppointmentReason> Reasons { get; }
    public IReadOnlyList<WeeklyAvailabilityWindow> WeeklyAvailability { get; }
    public IReadOnlyList<AppointmentClosure> Closures { get; }

    public static AppointmentConfiguration Default { get; } = new(AppointmentSettings.Default, [], [], []);

    public AppointmentConfiguration(
        AppointmentSettings settings,
        IReadOnlyList<AppointmentReason> reasons,
        IReadOnlyList<WeeklyAvailabilityWindow> weeklyAvailability,
        IReadOnlyList<AppointmentClosure> closures)
    {
        settings.EnsureIsValid();
        EnsureHasAtMost(reasons.Count, MaximumReasons, "motifs");
        EnsureHasAtMost(weeklyAvailability.Count, MaximumWeeklyWindows, "plages horaires");
        EnsureHasAtMost(closures.Count, MaximumClosures, "fermetures");
        reasons.ToList().ForEach(reason => reason.EnsureIsValid());
        weeklyAvailability.ToList().ForEach(window => window.EnsureIsValid());
        closures.ToList().ForEach(closure => closure.EnsureIsValid());

        if (reasons.Select(reason => reason.Id).Distinct().Count() != reasons.Count)
        {
            throw new InvalidAppointmentException("Deux motifs ne peuvent pas avoir le même identifiant.");
        }

        if (weeklyAvailability.Where((window, index) => weeklyAvailability.Skip(index + 1).Any(window.Overlaps)).Any())
        {
            throw new InvalidAppointmentException("Deux plages horaires d’une même personne ne se chevauchent pas.");
        }

        Settings = settings;
        Reasons = reasons;
        WeeklyAvailability = weeklyAvailability;
        Closures = closures;
    }

    public AppointmentReason? FindActiveReason(Guid reasonId) =>
        Reasons.FirstOrDefault(reason => reason.Id == reasonId && reason.IsActive);

    private static void EnsureHasAtMost(int count, int maximum, string name)
    {
        if (count > maximum)
        {
            throw new InvalidAppointmentException($"Au plus {maximum} {name}.");
        }
    }
}
