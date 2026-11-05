using CrystalPharm.Prescriptions.Application.Dtos;
using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Domain;
using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.Prescriptions.Domain.ValueObjects;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Prescriptions.Application.Services;

public sealed class PrescriptionSubmissionService(
    IPrescriptionSubmissionRepository submissionRepository,
    IPrescriptionDocumentStore documentStore,
    IMalwareScanner malwareScanner,
    IPrescriptionAccessLog accessLog,
    ITenantContext tenantContext,
    TimeProvider timeProvider) : IPrescriptionSubmissionService
{
    private const int MaximumListedSubmissions = 100;
    private const string UnsupportedFormatRefusal = "Les fichiers doivent être des photos (JPEG, PNG, WebP, HEIC) ou des PDF.";
    private const string MalwareRefusal = "Un des fichiers n’a pas pu être accepté.";

    /// <summary>Le temps de déposer les fichiers, bien en deçà de la fenêtre de l'envoi.</summary>
    private static readonly TimeSpan UploadLinkValidity = TimeSpan.FromMinutes(15);

    /// <summary>Le navigateur suit le lien aussitôt : il n'a pas à vivre plus longtemps.</summary>
    private static readonly TimeSpan DownloadLinkValidity = TimeSpan.FromMinutes(2);

    public async Task<PrescriptionSubmissionResult> SubmitAsync(
        NewPrescriptionSubmissionDto newSubmission,
        CancellationToken cancellationToken)
    {
        var alreadyReceived = await submissionRepository.FindByIdempotencyKeyAsync(newSubmission.IdempotencyKey.Trim(), cancellationToken);
        if (alreadyReceived is not null)
        {
            return new PrescriptionSubmissionResult(alreadyReceived.Id, AlreadyReceived: true);
        }

        var now = timeProvider.GetUtcNow();
        var details = DetailsOf(
            newSubmission.FirstName,
            newSubmission.LastName,
            newSubmission.BirthDate,
            newSubmission.Phone,
            newSubmission.Email,
            newSubmission.PlannedVisitAt,
            newSubmission.HasAlreadyVisited,
            newSubmission.IsRenewal,
            newSubmission.NoteFromPatient,
            newSubmission.SocialSecurityNumber,
            now);

        var drafts = new List<DocumentDraft>();
        foreach (var document in newSubmission.Documents)
        {
            drafts.Add(await InspectAsync(document, cancellationToken));
        }

        var submission = PrescriptionSubmission.Submit(
            newSubmission.IdempotencyKey,
            details.Patient,
            details.Email,
            details.Request,
            details.SocialSecurityNumber,
            drafts,
            now);

        var storedKeys = new List<string>();
        try
        {
            foreach (var document in submission.Documents)
            {
                var incoming = newSubmission.Documents[document.Position];
                await using var content = incoming.OpenRead();
                var storageKey = StorageKeyOf(document);
                await documentStore.SaveAsync(storageKey, content, cancellationToken);
                storedKeys.Add(storageKey);
            }

            submissionRepository.Add(submission);
            await submissionRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DuplicateSubmissionException)
        {
            await DeleteStoredFilesAsync(storedKeys);
            var winner = await submissionRepository.FindByIdempotencyKeyAsync(newSubmission.IdempotencyKey.Trim(), cancellationToken);
            // L'envoi concurrent qui a gagné la contrainte d'unicité est enregistré : il existe forcément.
            return new PrescriptionSubmissionResult(winner!.Id, AlreadyReceived: true);
        }
        catch
        {
            await DeleteStoredFilesAsync(storedKeys);
            throw;
        }

        return new PrescriptionSubmissionResult(submission.Id, AlreadyReceived: false);
    }

    public async Task<PrescriptionUploadStartResult> StartUploadAsync(NewPrescriptionUploadDto newUpload, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var uploadLinksExpireAt = now + UploadLinkValidity;
        var alreadyStarted = await submissionRepository.FindByIdempotencyKeyAsync(newUpload.IdempotencyKey.Trim(), cancellationToken);
        if (alreadyStarted is not null)
        {
            return await ReplayUploadStartAsync(alreadyStarted, now, uploadLinksExpireAt);
        }

        var details = DetailsOf(
            newUpload.FirstName,
            newUpload.LastName,
            newUpload.BirthDate,
            newUpload.Phone,
            newUpload.Email,
            newUpload.PlannedVisitAt,
            newUpload.HasAlreadyVisited,
            newUpload.IsRenewal,
            newUpload.NoteFromPatient,
            newUpload.SocialSecurityNumber,
            now);
        var submission = PrescriptionSubmission.StartAwaitingDocuments(
            newUpload.IdempotencyKey,
            details.Patient,
            details.Email,
            details.Request,
            details.SocialSecurityNumber,
            newUpload.Documents.Select(ToAnnouncedDraft).ToArray(),
            now);

        try
        {
            submissionRepository.Add(submission);
            await submissionRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DuplicateSubmissionException)
        {
            // L'envoi concurrent qui a gagné la contrainte d'unicité est enregistré : il existe forcément.
            var winner = await submissionRepository.FindByIdempotencyKeyAsync(newUpload.IdempotencyKey.Trim(), cancellationToken);
            return await ReplayUploadStartAsync(winner!, now, uploadLinksExpireAt);
        }

        return new PrescriptionUploadStartResult(submission.Id, AlreadyStarted: false, AlreadyReceived: false, await UploadLinksOfAsync(submission, uploadLinksExpireAt), uploadLinksExpireAt);
    }

    public async Task<PrescriptionSubmissionResult?> CompleteUploadAsync(string idempotencyKey, CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindByIdempotencyKeyForUpdateAsync(idempotencyKey.Trim(), cancellationToken);
        if (submission is null)
        {
            return null;
        }

        if (!submission.IsAwaitingDocuments)
        {
            return new PrescriptionSubmissionResult(submission.Id, AlreadyReceived: true);
        }

        var now = timeProvider.GetUtcNow();
        if (submission.HasUploadWindowClosed(now))
        {
            await DeleteWithFilesAsync([submission], cancellationToken);
            throw new InvalidPrescriptionException("L’envoi a expiré : recommencez-le.");
        }

        foreach (var document in submission.Documents)
        {
            await VerifyUploadedDocumentAsync(submission, document, cancellationToken);
        }

        submission.ConfirmDocuments(now);
        await submissionRepository.SaveChangesAsync(cancellationToken);
        return new PrescriptionSubmissionResult(submission.Id, AlreadyReceived: false);
    }

    public async Task<IReadOnlyList<ReceivedPrescriptionSummaryDto>> ListReceivedAsync(CancellationToken cancellationToken)
    {
        await DeleteSubmissionsPastRetentionAsync(cancellationToken);
        var submissions = await submissionRepository.ListLatestAsync(MaximumListedSubmissions, cancellationToken);
        await accessLog.RecordAsync("prescriptions.list", submissions.Select(submission => submission.Id).ToArray(), cancellationToken);
        return submissions.Select(ReceivedPrescriptionSummaryDto.From).ToArray();
    }

    public async Task<ReceivedPrescriptionDto?> FindReceivedAsync(Guid submissionId, CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindAsync(submissionId, cancellationToken);
        if (submission is null)
        {
            return null;
        }

        await accessLog.RecordAsync("prescriptions.read", [submission.Id], cancellationToken);
        return ReceivedPrescriptionDto.From(submission);
    }

    public async Task<ReceivedDocumentContent?> OpenReceivedDocumentAsync(Guid submissionId, Guid documentId, CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindAsync(submissionId, cancellationToken);
        var document = submission?.Documents.SingleOrDefault(candidate => candidate.Id == documentId);
        if (document is null)
        {
            return null;
        }

        var content = await documentStore.OpenReadAsync(StorageKeyOf(document), cancellationToken);
        if (content is null)
        {
            return null;
        }

        await accessLog.RecordAsync("prescriptions.document", [document.SubmissionId], cancellationToken);
        return new ReceivedDocumentContent(content, document.Format.ToMimeType());
    }

    public async Task<ReceivedDocumentLinkDto?> CreateReceivedDocumentLinkAsync(Guid submissionId, Guid documentId, CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindAsync(submissionId, cancellationToken);
        var document = submission?.Documents.SingleOrDefault(candidate => candidate.Id == documentId);
        if (document is null)
        {
            return null;
        }

        var expiresAt = timeProvider.GetUtcNow() + DownloadLinkValidity;
        var url = await documentStore.CreateDownloadLinkAsync(StorageKeyOf(document), document.Format.ToMimeType(), expiresAt);
        await accessLog.RecordAsync("prescriptions.document", [document.SubmissionId], cancellationToken);
        return new ReceivedDocumentLinkDto(url, expiresAt);
    }

    public async Task<ReceivedPrescriptionDto?> ChangeStatusAsync(
        Guid submissionId,
        PrescriptionStatusChangeDto change,
        CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindForUpdateAsync(submissionId, cancellationToken);
        if (submission is null)
        {
            return null;
        }

        submission.MoveTo(change.Status, change.ExpectedProductsOn, timeProvider.GetUtcNow());
        await submissionRepository.SaveChangesAsync(cancellationToken);
        await accessLog.RecordAsync("prescriptions.status", [submission.Id], cancellationToken);
        return ReceivedPrescriptionDto.From(submission);
    }

    public async Task<ReceivedPrescriptionDto?> WriteTeamNoteAsync(
        Guid submissionId,
        PrescriptionTeamNoteDto teamNote,
        CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindForUpdateAsync(submissionId, cancellationToken);
        if (submission is null)
        {
            return null;
        }

        submission.WriteTeamNote(teamNote.Note);
        await submissionRepository.SaveChangesAsync(cancellationToken);
        await accessLog.RecordAsync("prescriptions.note", [submission.Id], cancellationToken);
        return ReceivedPrescriptionDto.From(submission);
    }

    public async Task<bool> DeleteAsync(Guid submissionId, CancellationToken cancellationToken)
    {
        var submission = await submissionRepository.FindForUpdateAsync(submissionId, cancellationToken);
        if (submission is null)
        {
            return false;
        }

        await DeleteWithFilesAsync([submission], cancellationToken);
        await accessLog.RecordAsync("prescriptions.delete", [submissionId], cancellationToken);
        return true;
    }

    private async Task DeleteSubmissionsPastRetentionAsync(CancellationToken cancellationToken)
    {
        var expiredSubmissions = await submissionRepository.ListPastRetentionAsync(timeProvider.GetUtcNow(), cancellationToken);
        if (expiredSubmissions.Count == 0)
        {
            return;
        }

        await DeleteWithFilesAsync(expiredSubmissions, cancellationToken);
        await accessLog.RecordAsync("prescriptions.retention", expiredSubmissions.Select(submission => submission.Id).ToArray(), cancellationToken);
    }

    // La ligne part avant les fichiers : un fichier resté orphelin ne se relit plus, une ligne sans fichier tromperait l'équipe.
    private async Task DeleteWithFilesAsync(IReadOnlyCollection<PrescriptionSubmission> submissions, CancellationToken cancellationToken)
    {
        var storageKeys = submissions.SelectMany(submission => submission.Documents).Select(StorageKeyOf).ToArray();
        foreach (var submission in submissions)
        {
            submissionRepository.Remove(submission);
        }

        await submissionRepository.SaveChangesAsync(cancellationToken);
        await DeleteStoredFilesAsync(storageKeys);
    }

    private sealed record SubmissionDetails(
        PatientIdentity Patient,
        PatientEmail Email,
        SubmissionRequest Request,
        SocialSecurityNumber? SocialSecurityNumber);

    private static SubmissionDetails DetailsOf(
        string firstName,
        string lastName,
        DateOnly birthDate,
        string phone,
        string? email,
        DateTime? plannedVisitAt,
        bool hasAlreadyVisited,
        bool isRenewal,
        string? noteFromPatient,
        string? socialSecurityNumber,
        DateTimeOffset now) => new(
        new PatientIdentity(firstName, lastName, birthDate, phone, DateOnly.FromDateTime(now.UtcDateTime)),
        new PatientEmail(email ?? string.Empty),
        new SubmissionRequest(plannedVisitAt, hasAlreadyVisited, isRenewal, noteFromPatient),
        string.IsNullOrWhiteSpace(socialSecurityNumber) ? null : new SocialSecurityNumber(socialSecurityNumber));

    private static DocumentDraft ToAnnouncedDraft(AnnouncedDocument announced) =>
        DocumentFormatDetection.TryParseMimeType(announced.MimeType, out var format)
            ? new DocumentDraft(announced.Kind, format.Value, announced.SizeInBytes)
            : throw new InvalidPrescriptionException(UnsupportedFormatRefusal);

    private async Task<PrescriptionUploadStartResult> ReplayUploadStartAsync(
        PrescriptionSubmission alreadyStarted,
        DateTimeOffset now,
        DateTimeOffset uploadLinksExpireAt)
    {
        if (!alreadyStarted.IsAwaitingDocuments)
        {
            return new PrescriptionUploadStartResult(alreadyStarted.Id, AlreadyStarted: true, AlreadyReceived: true, [], uploadLinksExpireAt);
        }

        if (alreadyStarted.HasUploadWindowClosed(now))
        {
            throw new InvalidPrescriptionException("L’envoi a expiré : recommencez-le.");
        }

        return new PrescriptionUploadStartResult(alreadyStarted.Id, AlreadyStarted: true, AlreadyReceived: false, await UploadLinksOfAsync(alreadyStarted, uploadLinksExpireAt), uploadLinksExpireAt);
    }

    private async Task<IReadOnlyList<DocumentUploadLinkDto>> UploadLinksOfAsync(PrescriptionSubmission submission, DateTimeOffset expiresAt)
    {
        var links = new List<DocumentUploadLinkDto>();
        foreach (var document in submission.Documents.OrderBy(document => document.Position))
        {
            var link = await documentStore.CreateUploadLinkAsync(StorageKeyOf(document), document.Format.ToMimeType(), document.SizeInBytes, expiresAt);
            links.Add(new DocumentUploadLinkDto(document.Position, link.Url, link.RequiredHeaders));
        }

        return links;
    }

    // Ce que le navigateur a déposé n'est cru qu'après vérification : taille, format reconnu au contenu, antivirus.
    // Un fichier refusé fait tomber tout l'envoi, effacé avec ce qui a été déposé.
    private async Task VerifyUploadedDocumentAsync(PrescriptionSubmission submission, SubmittedDocument document, CancellationToken cancellationToken)
    {
        var storageKey = StorageKeyOf(document);
        var storedSize = await documentStore.FindSizeAsync(storageKey, cancellationToken)
            ?? throw new InvalidPrescriptionException("Un des fichiers n’est pas arrivé : réessayez.");
        var header = await documentStore.ReadBeginningAsync(storageKey, DocumentFormatDetection.HeaderLength, cancellationToken) ?? [];
        var isAnnouncedDocument = DocumentFormatDetection.TryDetect(header, out var detectedFormat)
            && document.IsAnnouncedAs(detectedFormat.Value, storedSize);
        if (!isAnnouncedDocument)
        {
            await DeleteWithFilesAsync([submission], cancellationToken);
            throw new InvalidPrescriptionException(UnsupportedFormatRefusal);
        }

        await using var content = await documentStore.OpenReadAsync(storageKey, cancellationToken) ?? Stream.Null;
        if (!await malwareScanner.IsCleanAsync(content, cancellationToken))
        {
            await DeleteWithFilesAsync([submission], cancellationToken);
            throw new InvalidPrescriptionException(MalwareRefusal);
        }
    }

    private async Task<DocumentDraft> InspectAsync(IncomingDocument document, CancellationToken cancellationToken)
    {
        await using var content = document.OpenRead();
        var header = new byte[DocumentFormatDetection.HeaderLength];
        var headerLength = await content.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);
        if (!DocumentFormatDetection.TryDetect(header.AsSpan(0, headerLength), out var format))
        {
            throw new InvalidPrescriptionException(UnsupportedFormatRefusal);
        }

        content.Seek(0, SeekOrigin.Begin);
        if (!await malwareScanner.IsCleanAsync(content, cancellationToken))
        {
            throw new InvalidPrescriptionException(MalwareRefusal);
        }

        return new DocumentDraft(document.Kind, format.Value, document.SizeInBytes);
    }

    private string StorageKeyOf(SubmittedDocument document) => $"{tenantContext.TenantId:N}/{document.StorageKey}";

    private async Task DeleteStoredFilesAsync(IEnumerable<string> storedKeys)
    {
        foreach (var storageKey in storedKeys)
        {
            await documentStore.DeleteAsync(storageKey, CancellationToken.None);
        }
    }
}
