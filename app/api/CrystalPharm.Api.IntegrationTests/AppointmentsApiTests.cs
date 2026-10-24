using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Domain.Entities;
using Npgsql;

namespace CrystalPharm.Api.IntegrationTests;

[Collection(BookingApiCollection.Name)]
public sealed class AppointmentsApiTests(BookingApiFixture api)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private static NewAppointmentDto VaccinationOf(Guid employeeId, DateOnly day, TimeOnly startTime) =>
        new(employeeId, day, startTime, startTime.AddMinutes(15), "Camille Durand", "06 12 34 56 78", "Vaccination");

    private HttpClient ClientOfManager(Guid tenantId, string audience = ManagerTokens.Audience)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", api.ManagerTokens.IssueFor(tenantId, audience));
        return client;
    }

    private static async Task<AppointmentDto> ScheduleAsync(HttpClient client, NewAppointmentDto newAppointment)
    {
        var response = await client.PostAsJsonAsync("booking/appointments", newAppointment, JsonOptions);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var appointment = await response.Content.ReadFromJsonAsync<AppointmentDto>(JsonOptions);
        Assert.NotNull(appointment);
        return appointment;
    }

    [Fact]
    public async Task A_request_without_a_manager_token_is_refused()
    {
        var response = await api.CreateClient().GetAsync("booking/appointments?day=2026-10-19");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_token_issued_for_another_audience_is_refused()
    {
        var response = await ClientOfManager(Guid.NewGuid(), "another-api").GetAsync("booking/appointments?day=2026-10-19");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_manager_schedules_lists_and_confirms_an_appointment_of_their_pharmacy()
    {
        var manager = ClientOfManager(Guid.NewGuid());
        var day = new DateOnly(2026, 10, 19);

        var scheduled = await ScheduleAsync(manager, VaccinationOf(Guid.NewGuid(), day, new TimeOnly(8, 45)));
        var confirmation = await manager.PostAsync($"booking/appointments/{scheduled.Id}/confirm", null);
        var appointments = await manager.GetFromJsonAsync<AppointmentDto[]>($"booking/appointments?day={day:yyyy-MM-dd}", JsonOptions);

        Assert.Equal(HttpStatusCode.NoContent, confirmation.StatusCode);
        var listed = Assert.Single(appointments!);
        Assert.Equal(scheduled.Id, listed.Id);
        Assert.Equal(AppointmentStatus.Confirmed, listed.Status);
    }

    [Fact]
    public async Task A_pharmacy_never_reads_nor_changes_the_appointments_of_another()
    {
        var firstPharmacy = ClientOfManager(Guid.NewGuid());
        var secondPharmacy = ClientOfManager(Guid.NewGuid());
        var day = new DateOnly(2026, 10, 20);
        var scheduled = await ScheduleAsync(firstPharmacy, VaccinationOf(Guid.NewGuid(), day, new TimeOnly(9, 0)));

        var listedBySecond = await secondPharmacy.GetFromJsonAsync<AppointmentDto[]>($"booking/appointments?day={day:yyyy-MM-dd}", JsonOptions);
        var readBySecond = await secondPharmacy.GetAsync($"booking/appointments/{scheduled.Id}");
        var cancelledBySecond = await secondPharmacy.PostAsync($"booking/appointments/{scheduled.Id}/cancel", null);
        var stillListedByFirst = await firstPharmacy.GetFromJsonAsync<AppointmentDto[]>($"booking/appointments?day={day:yyyy-MM-dd}", JsonOptions);

        Assert.Empty(listedBySecond!);
        Assert.Equal(HttpStatusCode.NotFound, readBySecond.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, cancelledBySecond.StatusCode);
        Assert.Equal(AppointmentStatus.Pending, Assert.Single(stillListedByFirst!).Status);
    }

    [Fact]
    public async Task Two_simultaneous_bookings_of_the_same_slot_let_only_one_through()
    {
        var manager = ClientOfManager(Guid.NewGuid());
        var employeeId = Guid.NewGuid();
        var day = new DateOnly(2026, 10, 21);

        var responses = await Task.WhenAll(
            manager.PostAsJsonAsync("booking/appointments", VaccinationOf(employeeId, day, new TimeOnly(10, 0)), JsonOptions),
            manager.PostAsJsonAsync("booking/appointments", VaccinationOf(employeeId, day, new TimeOnly(10, 5)), JsonOptions));

        Assert.Equal(
            [HttpStatusCode.Created, HttpStatusCode.Conflict],
            responses.Select(response => response.StatusCode).Order().ToArray());
    }

    [Fact]
    public async Task A_cancelled_appointment_frees_its_slot()
    {
        var manager = ClientOfManager(Guid.NewGuid());
        var employeeId = Guid.NewGuid();
        var day = new DateOnly(2026, 10, 22);
        var cancelled = await ScheduleAsync(manager, VaccinationOf(employeeId, day, new TimeOnly(11, 0)));
        await manager.PostAsync($"booking/appointments/{cancelled.Id}/cancel", null);

        await ScheduleAsync(manager, VaccinationOf(employeeId, day, new TimeOnly(11, 0)));
    }

    [Fact]
    public async Task An_invalid_appointment_is_refused_without_echoing_what_was_sent()
    {
        var manager = ClientOfManager(Guid.NewGuid());
        var withoutPatientName = VaccinationOf(Guid.NewGuid(), new DateOnly(2026, 10, 23), new TimeOnly(9, 0)) with
        {
            PatientName = " ",
            PatientPhone = "06 99 88 77 66",
        };

        var response = await manager.PostAsJsonAsync("booking/appointments", withoutPatientName, JsonOptions);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.DoesNotContain("06 99 88 77 66", body);
    }

    [Fact]
    public async Task Each_reading_of_appointments_is_traced()
    {
        var tenantId = Guid.NewGuid();
        var manager = ClientOfManager(tenantId);
        var scheduled = await ScheduleAsync(manager, VaccinationOf(Guid.NewGuid(), new DateOnly(2026, 10, 24), new TimeOnly(9, 0)));

        await manager.GetAsync($"booking/appointments/{scheduled.Id}");

        await using var connection = new NpgsqlConnection(api.SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "select caller_id from booking.health_data_access_records where tenant_id = @tenant_id and @appointment_id = any(appointment_ids)",
            connection);
        command.Parameters.AddWithValue("tenant_id", tenantId);
        command.Parameters.AddWithValue("appointment_id", scheduled.Id);
        Assert.Equal($"account-of-{tenantId}", await command.ExecuteScalarAsync());
    }

    [Fact]
    public async Task Without_an_active_tenant_the_database_shows_no_appointment()
    {
        await ScheduleAsync(ClientOfManager(Guid.NewGuid()), VaccinationOf(Guid.NewGuid(), new DateOnly(2026, 10, 26), new TimeOnly(9, 0)));

        await using var connection = new NpgsqlConnection(Environment.GetEnvironmentVariable("ConnectionStrings__Booking"));
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("select count(*) from booking.appointments", connection);
        Assert.Equal(0L, await command.ExecuteScalarAsync());
    }
}
