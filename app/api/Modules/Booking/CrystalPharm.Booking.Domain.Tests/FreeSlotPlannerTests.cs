using CrystalPharm.Booking.Domain.Configuration;
using CrystalPharm.Booking.Domain.Scheduling;

namespace CrystalPharm.Booking.Domain.Tests;

public sealed class FreeSlotPlannerTests
{
    private static readonly DateOnly Monday = new(2026, 10, 19);
    private static readonly Guid Employee = Guid.NewGuid();
    private static readonly DateTime LongBeforeMonday = new(2026, 10, 1, 8, 0, 0);

    private static AppointmentReason ReasonOf(int minutes) => new(Guid.NewGuid(), "Vaccination", null, null, minutes, true);

    private static AppointmentConfiguration ConfigurationOf(AppointmentSettings? settings = null, params AppointmentClosure[] closures) =>
        new(settings ?? AppointmentSettings.Default with { MinimumNoticeMinutes = 0 }, [], [], closures);

    private static AvailabilityWindow MorningWindow(Guid? employee = null) =>
        new(employee ?? Employee, Monday, new TimeOnly(9, 0), new TimeOnly(10, 0));

    private static IReadOnlyList<PlannedSlot> Plan(
        AppointmentReason reason,
        AppointmentConfiguration configuration,
        AvailabilityWindow[] windows,
        BookedPeriod[]? booked = null,
        DateTime? now = null) =>
        FreeSlotPlanner.PlanDay(Monday, reason, configuration, windows, booked ?? [], now ?? LongBeforeMonday);

    [Fact]
    public void A_window_is_cut_by_the_slot_step_and_the_duration_of_the_reason()
    {
        var slots = Plan(ReasonOf(30), ConfigurationOf(), [MorningWindow()]);

        Assert.Equal([new TimeOnly(9, 0), new TimeOnly(9, 15), new TimeOnly(9, 30)], slots.Select(slot => slot.StartTime));
        Assert.All(slots, slot => Assert.Equal(TimeSpan.FromMinutes(30), slot.EndTime - slot.StartTime));
    }

    [Fact]
    public void A_reason_longer_than_the_window_has_no_slot()
    {
        Assert.Empty(Plan(ReasonOf(90), ConfigurationOf(), [MorningWindow()]));
    }

    [Fact]
    public void A_booked_appointment_blocks_the_slots_that_overlap_it_for_the_same_person_only()
    {
        var colleague = Guid.NewGuid();
        var booked = new BookedPeriod(Employee, Monday, new TimeOnly(9, 15), new TimeOnly(9, 30));

        var slots = Plan(ReasonOf(15), ConfigurationOf(), [MorningWindow(), MorningWindow(colleague)], [booked]);

        Assert.DoesNotContain(slots, slot => slot.EmployeeId == Employee && slot.StartTime == new TimeOnly(9, 15));
        Assert.Contains(slots, slot => slot.EmployeeId == colleague && slot.StartTime == new TimeOnly(9, 15));
    }

    [Fact]
    public void The_buffer_keeps_a_pause_before_and_after_a_booked_appointment()
    {
        var settings = AppointmentSettings.Default with { MinimumNoticeMinutes = 0, BufferMinutes = 15 };
        var booked = new BookedPeriod(Employee, Monday, new TimeOnly(9, 30), new TimeOnly(9, 45));

        var slots = Plan(ReasonOf(15), ConfigurationOf(settings), [MorningWindow()], [booked]);

        Assert.Equal([new TimeOnly(9, 0)], slots.Select(slot => slot.StartTime));
    }

    [Fact]
    public void The_minimum_notice_hides_the_slots_that_are_too_soon()
    {
        var settings = AppointmentSettings.Default with { MinimumNoticeMinutes = 60 };

        var slots = Plan(ReasonOf(15), ConfigurationOf(settings), [MorningWindow()], now: Monday.ToDateTime(new TimeOnly(8, 30)));

        Assert.Equal(new TimeOnly(9, 30), slots.First().StartTime);
    }

    [Fact]
    public void A_closed_day_a_past_day_or_a_day_too_far_away_has_no_slot()
    {
        var closure = new AppointmentClosure(Monday, Monday, "Pont");
        Assert.Empty(Plan(ReasonOf(15), ConfigurationOf(closures: closure), [MorningWindow()]));

        Assert.Empty(Plan(ReasonOf(15), ConfigurationOf(), [MorningWindow()], now: Monday.AddDays(1).ToDateTime(new TimeOnly(8, 0))));

        var tooFar = AppointmentSettings.Default with { MinimumNoticeMinutes = 0, MaximumAdvanceDays = 7 };
        Assert.Empty(Plan(ReasonOf(15), ConfigurationOf(tooFar), [MorningWindow()], now: Monday.AddDays(-8).ToDateTime(new TimeOnly(8, 0))));
    }

    [Fact]
    public void A_pharmacy_that_paused_booking_has_no_slot()
    {
        var paused = AppointmentSettings.Default with { IsBookingOpen = false };

        Assert.Empty(Plan(ReasonOf(15), ConfigurationOf(paused), [MorningWindow()]));
    }

    [Fact]
    public void Weekly_windows_are_laid_on_the_matching_days_of_the_period()
    {
        var sundayWindow = new WeeklyAvailabilityWindow(Employee, 7, new TimeOnly(9, 0), new TimeOnly(12, 0));
        var mondayWindow = new WeeklyAvailabilityWindow(Employee, 1, new TimeOnly(14, 0), new TimeOnly(18, 0));

        var windows = FreeSlotPlanner.ExpandWeeklyAvailability([sundayWindow, mondayWindow], Monday, Monday.AddDays(6)).ToArray();

        Assert.Equal([Monday, Monday.AddDays(6)], windows.Select(window => window.Day));
    }
}
