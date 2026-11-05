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

/// <summary>L'envoi en trois temps : le site l'annonce, le navigateur dépose par lien pré-signé, le site le confirme.</summary>
[Collection(ApiCollection.Name)]
public sealed class PrescriptionUploadsApiTests(ApiFixture api)
{
    private static readonly JsonSerializerOptions ApiJson = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private static readonly byte[] PdfBytes = Encoding.ASCII.GetBytes("%PDF-1.7\n%uploaded document\n");
    private static readonly byte[] JpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02];

    private static readonly HttpClient Browser = new();

    private HttpClient ClientOfSite(Guid tenantId)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.ServiceKeyHeader, ApiFixture.SiteServiceKey);
        client.DefaultRequestHeaders.Add(SiteServiceAuthentication.TenantIdHeader, tenantId.ToString());
        return client;
    }

    private HttpClient ClientOfManager(Guid tenantId)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", api.ManagerTokens.IssueFor(tenantId));
        return client;
    }

    private static object StartForm(params (string Kind, byte[] Content, string ContentType)[] documents) => new
    {
        firstName = "Camille",
        lastName = "Durand",
        birthDate = "1985-05-17",
        phone = "0612345678",
        email = "camille.durand@example.org",
        plannedVisitAt = "2026-10-26T14:30",
        hasAlreadyVisited = false,
        isRenewal = false,
        socialSecurityNumber = "185057800608491",
        documents = documents.Select(document => new
        {
            kind = document.Kind,
            sizeInBytes = document.Content.LongLength,
            contentType = document.ContentType,
        }),
    };

    private static async Task<HttpResponseMessage> StartAsync(HttpClient site, string idempotencyKey, object form)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "prescriptions/uploads") { Content = JsonContent.Create(form) };
        request.Headers.Add("Idempotency-Key", idempotencyKey);
        return await site.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> CompleteAsync(HttpClient site, string idempotencyKey)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "prescriptions/uploads/completion");
        request.Headers.Add("Idempotency-Key", idempotencyKey);
        return await site.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> PutAsBrowserAsync(DocumentUploadLinkDto link, byte[] content, string? contentTypeOverride = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, link.Url) { Content = new ByteArrayContent(content) };
        foreach (var (name, value) in link.RequiredHeaders)
        {
            if (!request.Content.Headers.TryAddWithoutValidation(name, value))
            {
                request.Headers.TryAddWithoutValidation(name, value);
            }
        }

        if (contentTypeOverride is not null)
        {
            request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentTypeOverride);
        }

        return await Browser.SendAsync(request);
    }

    private static async Task<PrescriptionUploadStartResult> StartResultOfAsync(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<PrescriptionUploadStartResult>(ApiJson))!;

    private async Task<long> CountSubmissionsAsync(Guid tenantId)
    {
        await using var connection = new NpgsqlConnection(api.SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("select count(*) from prescriptions.submissions where tenant_id = @tenant", connection);
        command.Parameters.AddWithValue("tenant", tenantId);
        return (long)(await command.ExecuteScalarAsync())!;
    }

    [Fact]
    public async Task A_submission_uploaded_through_presigned_links_reaches_the_team_once_completed()
    {
        var tenantId = Guid.NewGuid();
        var key = Guid.NewGuid().ToString();
        using var site = ClientOfSite(tenantId);
        using var manager = ClientOfManager(tenantId);

        var startResponse = await StartAsync(site, key, StartForm(("prescription", PdfBytes, "application/pdf"), ("mutualCardFront", JpegBytes, "image/jpeg")));
        Assert.Equal(HttpStatusCode.Created, startResponse.StatusCode);
        var started = await StartResultOfAsync(startResponse);
        Assert.Equal(2, started.UploadLinks.Count);
        Assert.Empty(await manager.GetFromJsonAsync<List<JsonElement>>("received-prescriptions", ApiJson) ?? []);

        Assert.True((await PutAsBrowserAsync(started.UploadLinks[0], PdfBytes)).IsSuccessStatusCode);
        Assert.True((await PutAsBrowserAsync(started.UploadLinks[1], JpegBytes)).IsSuccessStatusCode);
        var completion = await CompleteAsync(site, key);

        Assert.Equal(HttpStatusCode.OK, completion.StatusCode);
        var detail = await manager.GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{started.SubmissionId}", ApiJson);
        Assert.Equal(2, detail!.Documents.Count);
    }

    [Fact]
    public async Task Replaying_the_start_returns_the_same_submission_and_the_completion_is_replayable()
    {
        var tenantId = Guid.NewGuid();
        var key = Guid.NewGuid().ToString();
        using var site = ClientOfSite(tenantId);
        var form = StartForm(("prescription", PdfBytes, "application/pdf"));

        var first = await StartResultOfAsync(await StartAsync(site, key, form));
        var replayResponse = await StartAsync(site, key, form);
        var replay = await StartResultOfAsync(replayResponse);
        await PutAsBrowserAsync(replay.UploadLinks[0], PdfBytes);

        Assert.Equal(HttpStatusCode.OK, replayResponse.StatusCode);
        Assert.Equal(first.SubmissionId, replay.SubmissionId);
        Assert.Equal(HttpStatusCode.OK, (await CompleteAsync(site, key)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await CompleteAsync(site, key)).StatusCode);
        Assert.Equal(1, await CountSubmissionsAsync(tenantId));
    }

    [Fact]
    public async Task A_file_that_is_not_what_was_announced_erases_the_whole_submission()
    {
        var tenantId = Guid.NewGuid();
        var key = Guid.NewGuid().ToString();
        using var site = ClientOfSite(tenantId);
        var disguised = Encoding.ASCII.GetBytes("MZ-not-a-pdf-at-all-but-same-size!");
        var started = await StartResultOfAsync(await StartAsync(site, key, StartForm(("prescription", disguised, "application/pdf"))));

        await PutAsBrowserAsync(started.UploadLinks[0], disguised);
        var completion = await CompleteAsync(site, key);

        Assert.Equal(HttpStatusCode.BadRequest, completion.StatusCode);
        Assert.Equal(0, await CountSubmissionsAsync(tenantId));
        Assert.Empty(await api.ListStoredKeysAsync($"{tenantId:N}/"));
    }

    [Fact]
    public async Task Completing_before_the_files_are_uploaded_is_refused_and_can_be_retried_once_they_are()
    {
        var tenantId = Guid.NewGuid();
        var key = Guid.NewGuid().ToString();
        using var site = ClientOfSite(tenantId);
        using var manager = ClientOfManager(tenantId);
        var started = await StartResultOfAsync(await StartAsync(site, key, StartForm(("prescription", PdfBytes, "application/pdf"))));

        var earlyCompletion = await CompleteAsync(site, key);
        Assert.Equal(HttpStatusCode.BadRequest, earlyCompletion.StatusCode);
        Assert.Empty(await manager.GetFromJsonAsync<List<JsonElement>>("received-prescriptions", ApiJson) ?? []);

        await PutAsBrowserAsync(started.UploadLinks[0], PdfBytes);
        Assert.Equal(HttpStatusCode.OK, (await CompleteAsync(site, key)).StatusCode);
    }

    [Fact]
    public async Task A_type_the_patient_cannot_send_is_refused_at_the_start()
    {
        using var site = ClientOfSite(Guid.NewGuid());

        var response = await StartAsync(site, Guid.NewGuid().ToString(), StartForm(("prescription", PdfBytes, "text/html")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task An_unknown_upload_or_one_of_another_pharmacy_cannot_be_completed()
    {
        var key = Guid.NewGuid().ToString();
        using var owner = ClientOfSite(Guid.NewGuid());
        using var intruder = ClientOfSite(Guid.NewGuid());
        var started = await StartResultOfAsync(await StartAsync(owner, key, StartForm(("prescription", PdfBytes, "application/pdf"))));
        await PutAsBrowserAsync(started.UploadLinks[0], PdfBytes);

        Assert.Equal(HttpStatusCode.NotFound, (await CompleteAsync(owner, Guid.NewGuid().ToString())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await CompleteAsync(intruder, key)).StatusCode);
    }

    [Fact]
    public async Task The_download_link_serves_the_file_with_its_detected_type_to_its_own_pharmacy_only()
    {
        var tenantId = Guid.NewGuid();
        var key = Guid.NewGuid().ToString();
        using var site = ClientOfSite(tenantId);
        var started = await StartResultOfAsync(await StartAsync(site, key, StartForm(("prescription", PdfBytes, "application/pdf"))));
        await PutAsBrowserAsync(started.UploadLinks[0], PdfBytes);
        await CompleteAsync(site, key);
        using var manager = ClientOfManager(tenantId);
        using var intruder = ClientOfManager(Guid.NewGuid());
        var detail = await manager.GetFromJsonAsync<ReceivedPrescriptionDto>($"received-prescriptions/{started.SubmissionId}", ApiJson);
        var linkPath = $"received-prescriptions/{started.SubmissionId}/documents/{detail!.Documents[0].Id}/link";

        var link = await manager.GetFromJsonAsync<ReceivedDocumentLinkDto>(linkPath, ApiJson);
        var download = await Browser.GetAsync(link!.Url);

        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("application/pdf", download.Content.Headers.ContentType?.MediaType);
        Assert.Equal(PdfBytes, await download.Content.ReadAsByteArrayAsync());
        Assert.Equal(HttpStatusCode.NotFound, (await intruder.GetAsync(linkPath)).StatusCode);
    }

    [Fact]
    public async Task A_presigned_upload_link_refuses_another_content_type()
    {
        using var site = ClientOfSite(Guid.NewGuid());
        var started = await StartResultOfAsync(await StartAsync(site, Guid.NewGuid().ToString(), StartForm(("prescription", PdfBytes, "application/pdf"))));

        var upload = await PutAsBrowserAsync(started.UploadLinks[0], PdfBytes, contentTypeOverride: "text/html");

        Assert.False(upload.IsSuccessStatusCode);
    }
}
