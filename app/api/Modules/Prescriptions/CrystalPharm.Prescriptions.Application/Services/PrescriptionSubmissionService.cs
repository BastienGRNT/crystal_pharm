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
        var patient = new PatientIdentity(
            newSubmission.FirstName,
            newSubmission.LastName,
            newSubmission.BirthDate,
            newSubmission.Phone,
            DateOnly.FromDateTime(now.UtcDateTime));
        var socialSecurityNumber = string.IsNullOrWhiteSpace(newSubmission.SocialSecurityNumber)
            ? null
            : new SocialSecurityNumber(newSubmission.SocialSecurityNumber);

        var drafts = new List<DocumentDraft>();
        foreach (var document in newSubmission.Documents)
        {
            drafts.Add(await InspectAsync(document, cancellationToken));
        }

        var submission = PrescriptionSubmission.Submit(
            newSubmission.IdempotencyKey,
            patient,
            newSubmission.PlannedVisitAt,
            newSubmission.HasAlreadyVisited,
            socialSecurityNumber,
            drafts,
            now);

        var storedKeys = new List<string>();
        try
        {
            foreach (var document in submission.Documents)
            {
                var incoming = newSubmission.Documents.Single(candidate => candidate.Kind == document.Kind);
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
            return new PrescriptionSubmissionResult(winner!.Id, AlreadyReceived: true);
        }
        catch
        {
            await DeleteStoredFilesAsync(storedKeys);
            throw;
        }

        return new PrescriptionSubmissionResult(submission.Id, AlreadyReceived: false);
    }

    public const int MaximumListedSubmissions = 100;

    public async Task<IReadOnlyList<ReceivedPrescriptionSummaryDto>> ListReceivedAsync(CancellationToken cancellationToken)
    {
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

        await accessLog.RecordAsync("prescriptions.document", [submission!.Id], cancellationToken);
        return new ReceivedDocumentContent(content, document.Format.ToMimeType());
    }

    private async Task<DocumentDraft> InspectAsync(IncomingDocument document, CancellationToken cancellationToken)
    {
        await using var content = document.OpenRead();
        var header = new byte[DocumentFormatDetection.HeaderLength];
        var headerLength = await content.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);
        if (!DocumentFormatDetection.TryDetect(header.AsSpan(0, headerLength), out var format))
        {
            throw new InvalidPrescriptionException("Les fichiers doivent être des photos (JPEG, PNG, WebP, HEIC) ou des PDF.");
        }

        content.Seek(0, SeekOrigin.Begin);
        if (!await malwareScanner.IsCleanAsync(content, cancellationToken))
        {
            throw new InvalidPrescriptionException("Un des fichiers n’a pas pu être accepté.");
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
