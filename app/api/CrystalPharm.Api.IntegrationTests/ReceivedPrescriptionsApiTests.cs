using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Prescriptions.Application.Dtos;
using CrystalPharm.Prescriptions.Domain.Entities;
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

    [Fact]
    public async Task A_manager_moves_a_submission_to_waiting_for_products_with_the_expected_day()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Attente");
        var expectedOn = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(2);
        using var client = ClientOfManager(tenantId);

        var response = await client.PutAsJsonAsync(
            $"received-prescriptions/{submissionId}/status",
            new PrescriptionStatusChangeDto(PrescriptionStatus.WaitingForProducts, expectedOn),
            ApiJson);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<ReceivedPrescriptionDto>(ApiJson);
        Assert.Equal(PrescriptionStatus.WaitingForProducts, updated!.Status);
        Assert.Equal(expectedOn, updated.ExpectedProductsOn);
    }

    [Fact]
    public async Task Moving_on_from_waiting_for_products_forgets_the_expected_day()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Prete");
        using var client = ClientOfManager(tenantId);
        await client.PutAsJsonAsync(
            $"received-prescriptions/{submissionId}/status",
            new PrescriptionStatusChangeDto(PrescriptionStatus.WaitingForProducts, DateOnly.FromDateTime(DateTime.UtcNow)),
            ApiJson);

        var response = await client.PutAsJsonAsync(
            $"received-prescriptions/{submissionId}/status",
            new PrescriptionStatusChangeDto(PrescriptionStatus.Ready, DateOnly.FromDateTime(DateTime.UtcNow)),
            ApiJson);

        var updated = await response.Content.ReadFromJsonAsync<ReceivedPrescriptionDto>(ApiJson);
        Assert.Equal(PrescriptionStatus.Ready, updated!.Status);
        Assert.Null(updated.ExpectedProductsOn);
    }

    [Fact]
    public async Task An_expected_day_in_the_past_is_refused()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Passe");

        var response = await ClientOfManager(tenantId).PutAsJsonAsync(
            $"received-prescriptions/{submissionId}/status",
            new PrescriptionStatusChangeDto(PrescriptionStatus.WaitingForProducts, DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1)),
            ApiJson);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task The_team_note_is_kept_on_the_submission()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Note");
        using var client = ClientOfManager(tenantId);

        await client.PutAsJsonAsync($"received-prescriptions/{submissionId}/team-note", new PrescriptionTeamNoteDto("  Rappeler pour le générique  "), ApiJson);

        var detail = await client.GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{submissionId}", ApiJson);
        Assert.Equal("Rappeler pour le générique", detail!.TeamNote);
    }

    [Fact]
    public async Task Another_tenant_can_neither_follow_up_nor_delete_a_submission()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Protege");
        using var intruder = ClientOfManager(Guid.NewGuid());

        var statusResponse = await intruder.PutAsJsonAsync(
            $"received-prescriptions/{submissionId}/status", new PrescriptionStatusChangeDto(PrescriptionStatus.Collected, null), ApiJson);
        var noteResponse = await intruder.PutAsJsonAsync(
            $"received-prescriptions/{submissionId}/team-note", new PrescriptionTeamNoteDto("intrus"), ApiJson);
        var deleteResponse = await intruder.DeleteAsync($"received-prescriptions/{submissionId}");

        Assert.Equal(HttpStatusCode.NotFound, statusResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, noteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);
        var detail = await ClientOfManager(tenantId).GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{submissionId}", ApiJson);
        Assert.Equal(PrescriptionStatus.Received, detail!.Status);
        Assert.Null(detail.TeamNote);
    }

    [Fact]
    public async Task Deleting_a_submission_removes_its_rows_and_its_files()
    {
        var tenantId = Guid.NewGuid();
        var submissionId = await SubmitAsync(tenantId, "Efface");
        using var client = ClientOfManager(tenantId);

        var response = await client.DeleteAsync($"received-prescriptions/{submissionId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"received-prescriptions/{submissionId}")).StatusCode);
        Assert.Equal(0, await CountAsync("select count(*) from prescriptions.documents where submission_id = @id", submissionId));
        var submissionDirectory = Path.Combine(api.PrescriptionStorageDirectory, tenantId.ToString("N"), submissionId.ToString("N"));
        Assert.True(!Directory.Exists(submissionDirectory) || Directory.GetFiles(submissionDirectory).Length == 0);
    }

    [Fact]
    public async Task Submissions_past_their_retention_are_erased_when_the_list_is_read()
    {
        var tenantId = Guid.NewGuid();
        var expiredId = await SubmitAsync(tenantId, "Ancien");
        var collectedLongAgoId = await SubmitAsync(tenantId, "Retire");
        var recentId = await SubmitAsync(tenantId, "Recent");
        await ExecuteAsSuperuserAsync(
            "update prescriptions.submissions set submitted_at = now() - interval '91 days' where id = @id", expiredId);
        await ExecuteAsSuperuserAsync(
            "update prescriptions.submissions set status = 'Collected', status_changed_at = now() - interval '31 days' where id = @id",
            collectedLongAgoId);

        var listed = await ClientOfManager(tenantId).GetFromJsonAsync<ReceivedPrescriptionSummaryDto[]>("received-prescriptions", ApiJson);

        Assert.Equal([recentId], listed!.Select(summary => summary.Id));
        Assert.Equal(0, await CountAsync(
            "select count(*) from prescriptions.submissions where id = any(@id)", new[] { expiredId, collectedLongAgoId }));
    }

    private async Task<long> CountAsync(string sql, object id)
    {
        await using var connection = new NpgsqlConnection(api.SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        return (long)(await command.ExecuteScalarAsync())!;
    }

    private async Task ExecuteAsSuperuserAsync(string sql, Guid id)
    {
        await using var connection = new NpgsqlConnection(api.SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        await command.ExecuteNonQueryAsync();
    }
}
