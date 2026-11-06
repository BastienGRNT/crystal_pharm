using CrystalPharm.Booking.Domain.Configuration;

namespace CrystalPharm.Booking.Domain.Tests;

public sealed class AppointmentConfigurationTests
{
    private static AppointmentReason Reason(int minutes = 15, string label = "Vaccination") =>
        new(Guid.NewGuid(), label, null, null, minutes, true);

    private static AppointmentConfiguration ConfigurationOf(
        AppointmentReason[]? reasons = null,
        WeeklyAvailabilityWindow[]? windows = null) =>
        new(AppointmentSettings.Default, reasons ?? [], windows ?? [], []);

    [Fact]
    public void A_pharmacy_without_any_setting_starts_open_with_no_reason_and_no_hours()
    {
        Assert.True(AppointmentConfiguration.Default.Settings.IsBookingOpen);
        Assert.Empty(AppointmentConfiguration.Default.Reasons);
        Assert.Empty(AppointmentConfiguration.Default.WeeklyAvailability);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(7)]
    [InlineData(245)]
    public void A_reason_lasts_a_multiple_of_five_minutes_within_limits(int minutes)
    {
        Assert.Throws<InvalidAppointmentException>(() => ConfigurationOf([Reason(minutes)]));
    }

    [Fact]
    public void A_reason_needs_a_name()
    {
        Assert.Throws<InvalidAppointmentException>(() => ConfigurationOf([Reason(label: "  ")]));
    }

    [Fact]
    public void Two_reasons_never_share_an_identifier()
    {
        var reason = Reason();

        Assert.Throws<InvalidAppointmentException>(() => ConfigurationOf([reason, reason with { Label = "Autre" }]));
    }

    [Fact]
    public void Two_windows_of_the_same_person_never_overlap_but_two_people_can_work_together()
    {
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();
        var morning = new WeeklyAvailabilityWindow(first, 1, new TimeOnly(9, 0), new TimeOnly(12, 0));

        Assert.Throws<InvalidAppointmentException>(() =>
            ConfigurationOf(windows: [morning, morning with { StartTime = new TimeOnly(11, 0), EndTime = new TimeOnly(13, 0) }]));
        _ = ConfigurationOf(windows: [morning, morning with { EmployeeId = second }]);
    }

    [Fact]
    public void A_window_ends_after_it_starts_on_a_real_day_of_the_week()
    {
        var employee = Guid.NewGuid();

        Assert.Throws<InvalidAppointmentException>(() =>
            ConfigurationOf(windows: [new WeeklyAvailabilityWindow(employee, 1, new TimeOnly(12, 0), new TimeOnly(9, 0))]));
        Assert.Throws<InvalidAppointmentException>(() =>
            ConfigurationOf(windows: [new WeeklyAvailabilityWindow(employee, 8, new TimeOnly(9, 0), new TimeOnly(12, 0))]));
    }

    [Fact]
    public void An_inactive_reason_cannot_be_found_for_booking()
    {
        var inactive = Reason() with { IsActive = false };

        Assert.Null(ConfigurationOf([inactive]).FindActiveReason(inactive.Id));
    }
}
