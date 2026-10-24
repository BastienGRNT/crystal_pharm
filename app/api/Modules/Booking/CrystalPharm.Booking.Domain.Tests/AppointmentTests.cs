using CrystalPharm.Booking.Domain;
using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.Booking.Domain.ValueObjects;

namespace CrystalPharm.Booking.Domain.Tests;

public sealed class AppointmentTests
{
    private static readonly DateOnly Monday = new(2026, 10, 19);
    private static readonly Guid EmployeeId = Guid.NewGuid();

    private static Appointment ScheduleVaccination() =>
        Appointment.Schedule(
            EmployeeId,
            new AppointmentSlot(Monday, new TimeOnly(8, 45), new TimeOnly(9, 0)),
            new PatientContact("Camille Durand", "06 12 34 56 78"),
            "Vaccination",
            DateTimeOffset.UnixEpoch);

    [Fact]
    public void A_new_appointment_waits_for_the_pharmacy_to_confirm_it()
    {
        Assert.Equal(AppointmentStatus.Pending, ScheduleVaccination().Status);
    }

    [Fact]
    public void A_slot_ends_after_it_starts()
    {
        Assert.Throws<InvalidAppointmentException>(() => new AppointmentSlot(Monday, new TimeOnly(9, 0), new TimeOnly(9, 0)));
        Assert.Throws<InvalidAppointmentException>(() => new AppointmentSlot(Monday, new TimeOnly(9, 0), new TimeOnly(8, 45)));
    }

    [Theory]
    [InlineData("", "06 12 34 56 78")]
    [InlineData("   ", "06 12 34 56 78")]
    [InlineData("Camille Durand", "")]
    public void A_patient_has_a_name_and_a_phone(string name, string phone)
    {
        Assert.Throws<InvalidAppointmentException>(() => new PatientContact(name, phone));
    }

    [Fact]
    public void The_patient_contact_is_kept_without_surrounding_spaces()
    {
        var patient = new PatientContact("  Camille Durand ", " 06 12 34 56 78 ");

        Assert.Equal("Camille Durand", patient.Name);
        Assert.Equal("06 12 34 56 78", patient.Phone);
    }

    [Fact]
    public void An_appointment_has_a_reason_and_an_employee()
    {
        var slot = new AppointmentSlot(Monday, new TimeOnly(8, 45), new TimeOnly(9, 0));
        var patient = new PatientContact("Camille Durand", "06 12 34 56 78");

        Assert.Throws<InvalidAppointmentException>(() => Appointment.Schedule(EmployeeId, slot, patient, " ", DateTimeOffset.UnixEpoch));
        Assert.Throws<InvalidAppointmentException>(() => Appointment.Schedule(Guid.Empty, slot, patient, "Vaccination", DateTimeOffset.UnixEpoch));
    }

    [Fact]
    public void Only_a_pending_appointment_can_be_confirmed()
    {
        var appointment = ScheduleVaccination();

        Assert.True(appointment.Confirm());
        Assert.False(appointment.Confirm());
        Assert.Equal(AppointmentStatus.Confirmed, appointment.Status);
    }

    [Fact]
    public void An_appointment_is_cancelled_once()
    {
        var appointment = ScheduleVaccination();

        Assert.True(appointment.Cancel());
        Assert.False(appointment.Cancel());
        Assert.False(appointment.Confirm());
        Assert.Equal(AppointmentStatus.Cancelled, appointment.Status);
    }
}
