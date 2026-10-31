using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Booking.Application.Dtos;

namespace CrystalPharm.Api.IntegrationTests;

[Collection(ApiCollection.Name)]
public sealed class AppointmentConfigurationApiTests(ApiFixture api)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private HttpClient ClientOfManager(Guid tenantId)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", api.ManagerTokens.IssueFor(tenantId, ManagerTokens.Audience));
        return client;
    }

    private HttpClient ClientOfSite(Guid tenantId)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.ServiceKeyHeader, ApiFixture.SiteServiceKey);
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.TenantIdHeader, tenantId.ToString());
        return client;
    }

    private static AppointmentConfigurationDto ConfigurationWithReason(Guid reasonId, string label, int durationMinutes) =>
        new(
            new AppointmentSettingsDto(true, false, 15, 0, 60, 0, "À bientôt !"),
            [new AppointmentReasonDto(reasonId, label, "Description", "Apportez votre carnet", durationMinutes, true)],
            [],
            []);

    [Fact]
    public async Task A_request_without_a_manager_token_is_refused()
    {
        var response = await api.CreateClient().GetAsync("booking/configuration");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_pharmacy_reads_back_the_configuration_it_saved_and_another_pharmacy_does_not_see_it()
    {
        var firstPharmacy = ClientOfManager(Guid.NewGuid());
        var secondPharmacy = ClientOfManager(Guid.NewGuid());
        var reasonId = Guid.NewGuid();

        var saved = await firstPharmacy.PutAsJsonAsync("booking/configuration", ConfigurationWithReason(reasonId, "Vaccination", 20), JsonOptions);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        var readByFirst = await firstPharmacy.GetFromJsonAsync<AppointmentConfigurationDto>("booking/configuration", JsonOptions);
        var readBySecond = await secondPharmacy.GetFromJsonAsync<AppointmentConfigurationDto>("booking/configuration", JsonOptions);

        Assert.Equal("Vaccination", Assert.Single(readByFirst!.Reasons).Label);
        Assert.Empty(readBySecond!.Reasons);
    }

    [Fact]
    public async Task Saving_twice_replaces_the_configuration()
    {
        var manager = ClientOfManager(Guid.NewGuid());

        await manager.PutAsJsonAsync("booking/configuration", ConfigurationWithReason(Guid.NewGuid(), "Premier", 10), JsonOptions);
        await manager.PutAsJsonAsync("booking/configuration", ConfigurationWithReason(Guid.NewGuid(), "Second", 30), JsonOptions);

        var configuration = await manager.GetFromJsonAsync<AppointmentConfigurationDto>("booking/configuration", JsonOptions);
        Assert.Equal("Second", Assert.Single(configuration!.Reasons).Label);
    }

    [Fact]
    public async Task A_reason_with_an_impossible_duration_is_refused()
    {
        var manager = ClientOfManager(Guid.NewGuid());

        var response = await manager.PutAsJsonAsync("booking/configuration", ConfigurationWithReason(Guid.NewGuid(), "Trop court", 3), JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_visitor_sees_only_the_active_reasons_of_the_pharmacy_of_the_site()
    {
        var tenantId = Guid.NewGuid();
        var configuration = new AppointmentConfigurationDto(
            new AppointmentSettingsDto(true, false, 15, 0, 60, 0, null),
            [
                new AppointmentReasonDto(Guid.NewGuid(), "Visible", null, null, 15, true),
                new AppointmentReasonDto(Guid.NewGuid(), "Masqué", null, null, 15, false),
            ],
            [],
            []);
        await ClientOfManager(tenantId).PutAsJsonAsync("booking/configuration", configuration, JsonOptions);

        var seenByVisitor = await ClientOfSite(tenantId).GetFromJsonAsync<VisitorAppointmentOptionsDto>("visitor/appointments/options", JsonOptions);
        var seenOnAnotherSite = await ClientOfSite(Guid.NewGuid()).GetFromJsonAsync<VisitorAppointmentOptionsDto>("visitor/appointments/options", JsonOptions);

        Assert.Equal("Visible", Assert.Single(seenByVisitor!.Reasons).Label);
        Assert.Empty(seenOnAnotherSite!.Reasons);
    }

    [Fact]
    public async Task A_manager_token_is_refused_on_the_visitor_endpoints()
    {
        var response = await ClientOfManager(Guid.NewGuid()).GetAsync("visitor/appointments/options");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
