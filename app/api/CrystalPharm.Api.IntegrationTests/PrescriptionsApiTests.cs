using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Prescriptions.Application.Dtos;
using Npgsql;

namespace CrystalPharm.Api.IntegrationTests;

[Collection(ApiCollection.Name)]
public sealed class PrescriptionsApiTests(ApiFixture api)
{
    private const string ValidSocialSecurityNumber = "185057800608491";

    private static readonly byte[] JpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02];
    private static readonly byte[] PdfBytes = Encoding.ASCII.GetBytes("%PDF-1.7\n%test document\n");

    private HttpClient ClientOfSite(Guid tenantId, string serviceKey = ApiFixture.SiteServiceKey)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.ServiceKeyHeader, serviceKey);
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.TenantIdHeader, tenantId.ToString());
        return client;
    }

    private static MultipartFormDataContent FormWith(
        Dictionary<string, string>? overrides = null,
        bool withoutPrescription = false,
        Dictionary<string, byte[]>? extraFiles = null)
    {
        var fields = new Dictionary<string, string>
        {
            ["firstName"] = "Camille",
            ["lastName"] = "Durand",
            ["birthDate"] = "1985-05-17",
            ["phone"] = "06 12 34 56 78",
            ["plannedVisitAt"] = "2026-10-26T14:30",
            ["hasAlreadyVisited"] = "false",
        };
        foreach (var (name, value) in overrides ?? [])
        {
            fields[name] = value;
        }

        var form = new MultipartFormDataContent();
        foreach (var (name, value) in fields)
        {
            form.Add(new StringContent(value), name);
        }

        if (!withoutPrescription)
        {
            AddFile(form, "prescriptionFile", PdfBytes);
        }

        foreach (var (name, content) in extraFiles ?? [])
        {
            AddFile(form, name, content);
        }

        return form;
    }

    private static void AddFile(MultipartFormDataContent form, string name, byte[] content)
    {
        var file = new ByteArrayContent(content);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        form.Add(file, name, $"{name}.bin");
    }

    private static HttpRequestMessage SubmitRequest(string idempotencyKey, MultipartFormDataContent form)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "prescriptions") { Content = form };
        request.Headers.Add("Idempotency-Key", idempotencyKey);
        return request;
    }

    private async Task<long> CountAsync(string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(api.SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        return (long)(await command.ExecuteScalarAsync())!;
    }

    private static async Task<PrescriptionSubmissionResult> ResultOfAsync(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<PrescriptionSubmissionResult>())!;

    [Fact]
    public async Task A_request_without_the_site_service_key_is_refused()
    {
        var response = await api.CreateClient().SendAsync(SubmitRequest(Guid.NewGuid().ToString(), FormWith()));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_request_with_a_wrong_site_service_key_is_refused()
    {
        var response = await ClientOfSite(Guid.NewGuid(), "not-the-key-not-the-key-not-the-key-").SendAsync(SubmitRequest(Guid.NewGuid().ToString(), FormWith()));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_manager_token_cannot_submit_a_prescription()
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", api.ManagerTokens.IssueFor(Guid.NewGuid()));

        var response = await client.SendAsync(SubmitRequest(Guid.NewGuid().ToString(), FormWith()));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Two_identities_at_once_are_refused()
    {
        var client = ClientOfSite(Guid.NewGuid());
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", api.ManagerTokens.IssueFor(Guid.NewGuid()));

        var response = await client.SendAsync(SubmitRequest(Guid.NewGuid().ToString(), FormWith()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_complete_submission_is_stored_in_the_database_and_on_disk()
    {
        var tenantId = Guid.NewGuid();
        var form = FormWith(
            new() { ["socialSecurityNumber"] = "1 85 05 78 006 084 91" },
            extraFiles: new() { ["mutualCardFront"] = JpegBytes, ["mutualCardBack"] = JpegBytes });

        var response = await ClientOfSite(tenantId).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), form));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await ResultOfAsync(response);
        Assert.False(result.AlreadyReceived);
        Assert.Equal(1, await CountAsync(
            "select count(*) from prescriptions.submissions where id = @id and tenant_id = @tenant and social_security_number = @number",
            ("id", result.SubmissionId), ("tenant", tenantId), ("number", ValidSocialSecurityNumber)));
        Assert.Equal(3, await CountAsync("select count(*) from prescriptions.documents where submission_id = @id", ("id", result.SubmissionId)));
        var storedFiles = Directory.GetFiles(Path.Combine(api.PrescriptionStorageDirectory, tenantId.ToString("N"), result.SubmissionId.ToString("N")));
        Assert.Equal(3, storedFiles.Length);
        Assert.Contains(storedFiles, file => File.ReadAllBytes(file).SequenceEqual(PdfBytes));
    }

    [Fact]
    public async Task A_patient_who_already_visited_keeps_no_vital_card_nor_mutual_card()
    {
        var form = FormWith(
            new() { ["hasAlreadyVisited"] = "true", ["socialSecurityNumber"] = ValidSocialSecurityNumber },
            extraFiles: new() { ["vitalCardPhoto"] = JpegBytes, ["mutualCardFront"] = JpegBytes });

        var response = await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), form));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await ResultOfAsync(response);
        Assert.Equal(1, await CountAsync("select count(*) from prescriptions.documents where submission_id = @id", ("id", result.SubmissionId)));
        Assert.Equal(1, await CountAsync(
            "select count(*) from prescriptions.submissions where id = @id and social_security_number is null",
            ("id", result.SubmissionId)));
    }

    [Fact]
    public async Task Replaying_a_submission_returns_the_same_one_without_creating_another()
    {
        var tenantId = Guid.NewGuid();
        var idempotencyKey = Guid.NewGuid().ToString();
        var client = ClientOfSite(tenantId);

        var first = await client.SendAsync(SubmitRequest(idempotencyKey, FormWith()));
        var replay = await client.SendAsync(SubmitRequest(idempotencyKey, FormWith()));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayed = await ResultOfAsync(replay);
        Assert.True(replayed.AlreadyReceived);
        Assert.Equal((await ResultOfAsync(first)).SubmissionId, replayed.SubmissionId);
        Assert.Equal(1, await CountAsync("select count(*) from prescriptions.submissions where tenant_id = @tenant", ("tenant", tenantId)));
    }

    [Fact]
    public async Task The_same_idempotency_key_in_two_pharmacies_makes_two_submissions()
    {
        var idempotencyKey = Guid.NewGuid().ToString();

        var first = await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(idempotencyKey, FormWith()));
        var second = await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(idempotencyKey, FormWith()));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);
        Assert.NotEqual((await ResultOfAsync(first)).SubmissionId, (await ResultOfAsync(second)).SubmissionId);
    }

    [Fact]
    public async Task A_file_that_is_not_a_photo_nor_a_pdf_is_refused_whatever_it_claims_to_be()
    {
        var tenantId = Guid.NewGuid();
        var form = FormWith(withoutPrescription: true, extraFiles: new() { ["prescriptionFile"] = Encoding.ASCII.GetBytes("<script>alert(1)</script>") });

        var response = await ClientOfSite(tenantId).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), form));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountAsync("select count(*) from prescriptions.submissions where tenant_id = @tenant", ("tenant", tenantId)));
        Assert.False(Directory.Exists(Path.Combine(api.PrescriptionStorageDirectory, tenantId.ToString("N"))));
    }

    [Fact]
    public async Task A_submission_without_prescription_is_refused()
    {
        var response = await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), FormWith(withoutPrescription: true)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_submission_without_idempotency_key_is_refused()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "prescriptions") { Content = FormWith() };

        var response = await ClientOfSite(Guid.NewGuid()).SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_social_security_number_with_a_wrong_key_is_refused()
    {
        var form = FormWith(new() { ["socialSecurityNumber"] = "185057800608490" });

        var response = await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), form));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_refusal_never_repeats_what_the_patient_typed()
    {
        var form = FormWith(new() { ["birthDate"] = "SECRET-BIRTHDATE", ["firstName"] = "SECRET-FIRSTNAME" });

        var response = await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), form));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("SECRET", body);
    }

    [Fact]
    public async Task The_database_hides_submissions_from_a_connection_that_names_no_pharmacy()
    {
        await ClientOfSite(Guid.NewGuid()).SendAsync(SubmitRequest(Guid.NewGuid().ToString(), FormWith()));

        await using var connection = new NpgsqlConnection(api.ApplicationRoleConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("select count(*) from prescriptions.submissions", connection);

        Assert.Equal(0, (long)(await command.ExecuteScalarAsync())!);
    }
}
