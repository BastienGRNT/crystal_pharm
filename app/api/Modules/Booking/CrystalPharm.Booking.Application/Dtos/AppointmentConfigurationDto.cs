using CrystalPharm.Booking.Domain.Configuration;

namespace CrystalPharm.Booking.Application.Dtos;

/// <summary>La configuration des rendez-vous de la pharmacie, telle que l'échangent le module <c>booking</c> et l'API.</summary>
public sealed record AppointmentConfigurationDto(
    AppointmentSettingsDto Settings,
    IReadOnlyList<AppointmentReasonDto> Reasons,
    IReadOnlyList<WeeklyAvailabilityWindowDto> WeeklyAvailability,
    IReadOnlyList<AppointmentClosureDto> Closures)
{
    public static AppointmentConfigurationDto From(AppointmentConfiguration configuration) =>
        new(
            AppointmentSettingsDto.From(configuration.Settings),
            configuration.Reasons.Select(AppointmentReasonDto.From).ToArray(),
            configuration.WeeklyAvailability.Select(WeeklyAvailabilityWindowDto.From).ToArray(),
            configuration.Closures.Select(AppointmentClosureDto.From).ToArray());

    /// <exception cref="Domain.InvalidAppointmentException">Quand une règle de la configuration n'est pas respectée.</exception>
    public AppointmentConfiguration ToDomain() =>
        new(
            Settings.ToDomain(),
            Reasons.Select(reason => reason.ToDomain()).ToArray(),
            WeeklyAvailability.Select(window => window.ToDomain()).ToArray(),
            Closures.Select(closure => closure.ToDomain()).ToArray());
}

public sealed record AppointmentSettingsDto(
    bool IsBookingOpen,
    bool ConfirmsAutomatically,
    int SlotStepMinutes,
    int MinimumNoticeMinutes,
    int MaximumAdvanceDays,
    int BufferMinutes,
    string? ConfirmationMessage)
{
    public static AppointmentSettingsDto From(AppointmentSettings settings) =>
        new(
            settings.IsBookingOpen,
            settings.ConfirmsAutomatically,
            settings.SlotStepMinutes,
            settings.MinimumNoticeMinutes,
            settings.MaximumAdvanceDays,
            settings.BufferMinutes,
            settings.ConfirmationMessage);

    public AppointmentSettings ToDomain() =>
        new(
            IsBookingOpen,
            ConfirmsAutomatically,
            SlotStepMinutes,
            MinimumNoticeMinutes,
            MaximumAdvanceDays,
            BufferMinutes,
            string.IsNullOrWhiteSpace(ConfirmationMessage) ? null : ConfirmationMessage.Trim());
}

public sealed record AppointmentReasonDto(
    Guid Id,
    string Label,
    string? Description,
    string? PreparationNote,
    int DurationMinutes,
    bool IsActive)
{
    public static AppointmentReasonDto From(AppointmentReason reason) =>
        new(reason.Id, reason.Label, reason.Description, reason.PreparationNote, reason.DurationMinutes, reason.IsActive);

    public AppointmentReason ToDomain() =>
        new(
            Id,
            Label.Trim(),
            string.IsNullOrWhiteSpace(Description) ? null : Description.Trim(),
            string.IsNullOrWhiteSpace(PreparationNote) ? null : PreparationNote.Trim(),
            DurationMinutes,
            IsActive);
}

public sealed record WeeklyAvailabilityWindowDto(Guid EmployeeId, int IsoDayOfWeek, TimeOnly StartTime, TimeOnly EndTime)
{
    public static WeeklyAvailabilityWindowDto From(WeeklyAvailabilityWindow window) =>
        new(window.EmployeeId, window.IsoDayOfWeek, window.StartTime, window.EndTime);

    public WeeklyAvailabilityWindow ToDomain() => new(EmployeeId, IsoDayOfWeek, StartTime, EndTime);
}

public sealed record AppointmentClosureDto(DateOnly FirstDay, DateOnly LastDay, string? Label)
{
    public static AppointmentClosureDto From(AppointmentClosure closure) => new(closure.FirstDay, closure.LastDay, closure.Label);

    public AppointmentClosure ToDomain() => new(FirstDay, LastDay, string.IsNullOrWhiteSpace(Label) ? null : Label.Trim());
}
