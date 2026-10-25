using CrystalPharm.Prescriptions.Domain.Entities;

namespace CrystalPharm.Prescriptions.Application.Dtos;

/// <summary>Un fichier reçu : sa nature, sa taille et de quoi le relire depuis le début autant de fois qu'il faut.</summary>
public sealed record IncomingDocument(DocumentKind Kind, long SizeInBytes, Func<Stream> OpenRead);

public sealed record NewPrescriptionSubmissionDto(
    string IdempotencyKey,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string Phone,
    DateTime PlannedVisitAt,
    bool HasAlreadyVisited,
    string? SocialSecurityNumber,
    IReadOnlyCollection<IncomingDocument> Documents);
