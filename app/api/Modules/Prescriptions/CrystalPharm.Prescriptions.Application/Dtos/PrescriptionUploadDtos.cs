using CrystalPharm.Prescriptions.Domain.Entities;

namespace CrystalPharm.Prescriptions.Application.Dtos;

/// <summary>Un fichier que le navigateur annonce avant de le déposer : sa nature, sa taille et son type.</summary>
public sealed record AnnouncedDocument(DocumentKind Kind, long SizeInBytes, string MimeType);

/// <summary>Un envoi dont les fichiers seront déposés par le navigateur, par des liens pré-signés.</summary>
public sealed record NewPrescriptionUploadDto(
    string IdempotencyKey,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string Phone,
    string? Email,
    DateTime? PlannedVisitAt,
    bool HasAlreadyVisited,
    bool IsRenewal,
    string? NoteFromPatient,
    string? SocialSecurityNumber,
    IReadOnlyList<AnnouncedDocument> Documents);

/// <param name="Position">La place du fichier dans ce que le navigateur a annoncé (0 pour le premier).</param>
/// <param name="Url">Le lien pré-signé, à appeler en <c>PUT</c> avec le fichier pour corps.</param>
/// <param name="RequiredHeaders">Les en-têtes à envoyer tels quels avec le fichier.</param>
public sealed record DocumentUploadLinkDto(int Position, Uri Url, IReadOnlyDictionary<string, string> RequiredHeaders);

/// <param name="SubmissionId">L'identifiant de l'envoi, rien de ce qu'il contient.</param>
/// <param name="AlreadyStarted">Vrai quand cette clé d'idempotence avait déjà commencé un envoi : c'est le même.</param>
/// <param name="AlreadyReceived">Vrai quand l'envoi est déjà arrivé chez l'équipe : il n'y a plus rien à déposer.</param>
/// <param name="UploadLinks">Un lien par fichier gardé ; un fichier annoncé sans lien est écarté (cf. « déjà venu »).</param>
/// <param name="UploadLinksExpireAt">Après, il faut recommencer l'envoi.</param>
public sealed record PrescriptionUploadStartResult(
    Guid SubmissionId,
    bool AlreadyStarted,
    bool AlreadyReceived,
    IReadOnlyList<DocumentUploadLinkDto> UploadLinks,
    DateTimeOffset UploadLinksExpireAt);

/// <param name="Url">Le lien pré-signé du fichier, valable peu de temps.</param>
public sealed record ReceivedDocumentLinkDto(Uri Url, DateTimeOffset ExpiresAt);
