using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Prescriptions.Application.Dtos;
using Npgsql;

namespace CrystalPharm.Api.IntegrationTests;

[Collection(ApiCollection.Name)]
public sealed class ReceivedPrescriptionsApiTests(ApiFixture api)
{
    private static readonly JsonSerializerOptions ApiJson = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private static readonly byte[] PdfBytes = Encoding.ASCII.GetBytes("%PDF-1.7\n%received document\n");

    private HttpClient ClientOfManager(Guid tenantId)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", api.ManagerTokens.IssueFor(tenantId));
        return client;
    }

    private async Task<Guid> SubmitAsync(Guid tenantId, string lastName)
    {
        using var client = api.CreateClient();
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.ServiceKeyHeader, ApiFixture.SiteServiceKey);
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.TenantIdHeader, tenantId.ToString());

        using var form = new MultipartFormDataContent
        {
            { new StringContent("Camille"), "firstName" },
            { new StringContent(lastName), "lastName" },
            { new StringContent("1985-05-17"), "birthDate" },
            { new StringContent("0612345678"), "phone" },
            { new StringContent("2026-10-26T14:30"), "plannedVisitAt" },
            { new StringContent("false"), "hasAlreadyVisited" },
            { new StringContent("185057800608491"), "socialSecurityNumber" },
        };
        var file = new ByteArrayContent(PdfBytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        form.Add(file, "prescriptionFile", "ordonnance.bin");

        using var request = new HttpRequestMessage(HttpMethod.Post, "prescriptions") { Content = form };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PrescriptionSubmissionResult>())!.SubmissionId;
    }

    [Fact]
    public async Task A_manager_lists_only_the_submissions_of_their_own_tenant()
    {
        var tenantId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();
        var ownId = await SubmitAsync(tenantId, "Visible");
        var foreignId = await SubmitAsync(otherTenantId, "Etranger");

        var listed = await ClientOfManager(tenantId).GetFromJsonAsync<ReceivedPrescriptionSummaryDto[]>("received-prescriptions", ApiJson);

        Assert.Contains(listed!, summary => summary.Id == ownId);
        Assert.DoesNotContain(listed!, summary => summary.Id == foreignId);
        Assert.All(listed!, summary => Assert.Equal(1, summary.DocumentCount));
    }

    [Fact]
    public async Task The_detail_shows_the_patient_and_the_files()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Durand");

        var detail = await ClientOfManager(tenantId).GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{submissionId}", ApiJson);

        Assert.Equal("Durand", detail!.LastName);
        Assert.Equal("185057800608491", detail.SocialSecurityNumber);
        Assert.Single(detail.Documents);
    }

    [Fact]
    public async Task Another_tenant_cannot_find_a_submission_nor_its_file()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Prive");
        var detail = await ClientOfManager(tenantId).GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{submissionId}", ApiJson);
        using var intruder = ClientOfManager(Guid.NewGuid());

        var detailResponse = await intruder.GetAsync($"received-prescriptions/{submissionId}");
        var fileResponse = await intruder.GetAsync($"received-prescriptions/{submissionId}/documents/{detail!.Documents[0].Id}");

        Assert.Equal(HttpStatusCode.NotFound, detailResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, fileResponse.StatusCode);
    }

    [Fact]
    public async Task A_file_is_streamed_with_its_real_type_and_never_cached()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Fichier");
        using var client = ClientOfManager(tenantId);
        var detail = await client.GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{submissionId}", ApiJson);

        var response = await client.GetAsync($"received-prescriptions/{submissionId}/documents/{detail!.Documents[0].Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Contains("no-store", response.Headers.CacheControl?.ToString());
        Assert.Equal(PdfBytes, await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task The_site_service_cannot_read_and_anonymous_callers_are_refused()
    {
        var tenantId = Guid.NewGuid();
        using var site = api.CreateClient();
        site.DefaultRequestHeaders.Add(SiteServiceAuthentication.ServiceKeyHeader, ApiFixture.SiteServiceKey);
        site.DefaultRequestHeaders.Add(SiteServiceAuthentication.TenantIdHeader, tenantId.ToString());
        using var anonymous = api.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await site.GetAsync("received-prescriptions")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("received-prescriptions")).StatusCode);
    }

    [Fact]
    public async Task Every_read_leaves_a_trace()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Trace");
        using var client = ClientOfManager(tenantId);
        var detail = await client.GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{submissionId}", ApiJson);

        await client.GetAsync("received-prescriptions");
        await client.GetAsync($"received-prescriptions/{submissionId}/documents/{detail!.Documents[0].Id}");

        await using var connection = new NpgsqlConnection(api.SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "select action from prescriptions.access_records where tenant_id = @tenant order by accessed_at", connection);
        command.Parameters.AddWithValue("tenant", tenantId);
        var actions = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            actions.Add(reader.GetString(0));
        }

        Assert.Equal(["prescriptions.read", "prescriptions.list", "prescriptions.document"], actions);
    }
}
