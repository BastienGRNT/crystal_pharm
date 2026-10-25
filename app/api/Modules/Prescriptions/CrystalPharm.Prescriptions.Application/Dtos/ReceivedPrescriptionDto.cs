using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.Prescriptions.Domain.ValueObjects;

namespace CrystalPharm.Prescriptions.Application.Dtos;

public sealed record ReceivedDocumentDto(Guid Id, DocumentKind Kind, DocumentFormat Format, long SizeInBytes)
{
    public static ReceivedDocumentDto From(SubmittedDocument document) => new(document.Id, document.Kind, document.Format, document.SizeInBytes);
}

/// <summary>Un envoi dans la liste : de quoi le reconnaître, sans le numéro de sécurité sociale.</summary>
public sealed record ReceivedPrescriptionSummaryDto(
    Guid Id,
    DateTimeOffset SubmittedAt,
    string FirstName,
    string LastName,
    string Phone,
    DateTime PlannedVisitAt,
    bool HasAlreadyVisited,
    int DocumentCount)
{
    public static ReceivedPrescriptionSummaryDto From(PrescriptionSubmission submission) =>
        new(
            submission.Id,
            submission.SubmittedAt,
            submission.FirstName,
            submission.LastName,
            submission.Phone,
            submission.PlannedVisitAt,
            submission.HasAlreadyVisited,
            submission.Documents.Count);
}

public sealed record ReceivedPrescriptionDto(
    Guid Id,
    DateTimeOffset SubmittedAt,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string Phone,
    DateTime PlannedVisitAt,
    bool HasAlreadyVisited,
    string? SocialSecurityNumber,
    IReadOnlyList<ReceivedDocumentDto> Documents)
{
    public static ReceivedPrescriptionDto From(PrescriptionSubmission submission) =>
        new(
            submission.Id,
            submission.SubmittedAt,
            submission.FirstName,
            submission.LastName,
            submission.BirthDate,
            submission.Phone,
            submission.PlannedVisitAt,
            submission.HasAlreadyVisited,
            submission.SocialSecurityNumber,
            submission.Documents.Select(ReceivedDocumentDto.From).ToArray());
}

/// <summary>Un fichier à renvoyer en flux : l'appelant ferme <see cref="Content"/>.</summary>
public sealed record ReceivedDocumentContent(Stream Content, string MimeType);
