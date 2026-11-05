using System.Globalization;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Api.Tenancy;
using CrystalPharm.Prescriptions.Application.Dtos;
using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Domain;
using CrystalPharm.Prescriptions.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CrystalPharm.Api.Controllers.Prescriptions;

/// <summary>Les ordonnances envoyées depuis le site d'une pharmacie, reçues par le service <c>site</c>.</summary>
[ApiController]
[Route("prescriptions")]
[Authorize(Policy = SiteServiceAuthentication.PolicyName)]
[EnableRateLimiting(PrescriptionRateLimiting.PolicyName)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PrescriptionsController(IPrescriptionSubmissionService submissionService) : ControllerBase
{
    // Les pages de l'ordonnance, la carte Vitale et les deux faces de la mutuelle, plus les champs.
    private const long MaximumRequestSizeInBytes =
        (PrescriptionSubmission.MaximumPrescriptionPages + 3) * SubmittedDocument.MaximumSizeInBytes + 1024 * 1024;

    // Les champs et la description des fichiers, jamais les fichiers eux-mêmes.
    private const long MaximumUploadStartSizeInBytes = 64 * 1024;

    /// <summary>
    /// Commence un envoi dont le navigateur dépose lui-même les fichiers : les champs, et ce qu'il annonce de chaque
    /// fichier (nature, taille, type). Renvoie un lien pré-signé par fichier gardé. L'en-tête <c>Idempotency-Key</c>
    /// rend l'appel rejouable : 200 et des liens neufs tant que l'envoi n'est pas confirmé, 200 sans lien après.
    /// </summary>
    [HttpPost("uploads")]
    [RequestSizeLimit(MaximumUploadStartSizeInBytes)]
    [Consumes("application/json")]
    [ProducesResponseType<PrescriptionUploadStartResult>(StatusCodes.Status201Created)]
    [ProducesResponseType<PrescriptionUploadStartResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<PrescriptionUploadStartResult>> StartUpload(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        [FromBody] PrescriptionUploadStartForm form,
        CancellationToken cancellationToken)
    {
        var result = await submissionService.StartUploadAsync(ToNewUpload(idempotencyKey, form), cancellationToken);
        return result.AlreadyStarted ? Ok(result) : StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>
    /// Confirme que les fichiers sont déposés : ils sont vérifiés (taille, format reconnu au contenu, antivirus) et
    /// l'envoi arrive chez l'équipe. Un fichier refusé efface tout l'envoi. Rejouable : 200 avec le même envoi.
    /// </summary>
    [HttpPost("uploads/completion")]
    [ProducesResponseType<PrescriptionSubmissionResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<PrescriptionSubmissionResult>> CompleteUpload(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            throw new InvalidPrescriptionException("L’identifiant de l’envoi est obligatoire.");
        }

        var result = await submissionService.CompleteUploadAsync(idempotencyKey, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Reçoit une ordonnance (une ou plusieurs pages) et, si le patient les a jointes, sa carte Vitale et sa mutuelle. L'en-tête
    /// <c>Idempotency-Key</c> rend l'appel rejouable : le rejouer renvoie le même envoi (200) sans en créer un second.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaximumRequestSizeInBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumRequestSizeInBytes)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<PrescriptionSubmissionResult>(StatusCodes.Status201Created)]
    [ProducesResponseType<PrescriptionSubmissionResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<PrescriptionSubmissionResult>> Submit(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        [FromForm] PrescriptionSubmissionForm form,
        CancellationToken cancellationToken)
    {
        var result = await submissionService.SubmitAsync(ToNewSubmission(idempotencyKey, form), cancellationToken);
        return result.AlreadyReceived ? Ok(result) : StatusCode(StatusCodes.Status201Created, result);
    }

    private static NewPrescriptionSubmissionDto ToNewSubmission(string? idempotencyKey, PrescriptionSubmissionForm form) => new(
        idempotencyKey ?? string.Empty,
        form.FirstName ?? string.Empty,
        form.LastName ?? string.Empty,
        ParseBirthDateOrRefuse(form.BirthDate),
        form.Phone ?? string.Empty,
        form.Email,
        ParseOptionalPlannedVisitOrRefuse(form.PlannedVisitAt),
        ParseBooleanOrRefuse(form.HasAlreadyVisited, "Le choix « déjà venu » n’est pas valide."),
        ParseBooleanOrRefuse(form.IsRenewal, "Le choix « renouvellement » n’est pas valide."),
        form.NoteFromPatient,
        form.SocialSecurityNumber,
        IncomingDocumentsOf(form));

    private static NewPrescriptionUploadDto ToNewUpload(string? idempotencyKey, PrescriptionUploadStartForm form) => new(
        idempotencyKey ?? string.Empty,
        form.FirstName ?? string.Empty,
        form.LastName ?? string.Empty,
        ParseBirthDateOrRefuse(form.BirthDate),
        form.Phone ?? string.Empty,
        form.Email,
        ParseOptionalPlannedVisitOrRefuse(form.PlannedVisitAt),
        form.HasAlreadyVisited,
        form.IsRenewal,
        form.NoteFromPatient,
        form.SocialSecurityNumber,
        (form.Documents ?? []).Select(ToAnnouncedDocumentOrRefuse).ToArray());

    private static AnnouncedDocument ToAnnouncedDocumentOrRefuse(AnnouncedDocumentForm document) =>
        Enum.TryParse<DocumentKind>(document.Kind, ignoreCase: true, out var kind) && Enum.IsDefined(kind)
            ? new AnnouncedDocument(kind, document.SizeInBytes, document.ContentType ?? string.Empty)
            : throw new InvalidPrescriptionException("La nature d’un des fichiers n’est pas valide.");

    private static IReadOnlyList<IncomingDocument> IncomingDocumentsOf(PrescriptionSubmissionForm form)
    {
        var prescriptionPages = new[] { form.PrescriptionFile }
            .Concat(form.AdditionalPrescriptionPages ?? [])
            .Select(page => (Kind: DocumentKind.Prescription, File: page));
        var files = prescriptionPages.Concat(new (DocumentKind Kind, IFormFile? File)[]
        {
            (DocumentKind.VitalCard, form.VitalCardPhoto),
            (DocumentKind.MutualCardFront, form.MutualCardFront),
            (DocumentKind.MutualCardBack, form.MutualCardBack),
        });
        return files
            .Where(candidate => candidate.File is not null)
            .Select(candidate => new IncomingDocument(candidate.Kind, candidate.File!.Length, candidate.File.OpenReadStream))
            .ToArray();
    }

    // Une saisie invalide est refusée avec un message fixe : le message de liaison d'ASP.NET recopierait la saisie.
    private static DateOnly ParseBirthDateOrRefuse(string? text) =>
        DateOnly.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var birthDate)
            ? birthDate
            : throw new InvalidPrescriptionException("La date de naissance n’est pas valide.");

    private static DateTime? ParseOptionalPlannedVisitOrRefuse(string? text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return null;
        }

        return DateTime.TryParseExact(text, "yyyy-MM-dd'T'HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var plannedVisitAt)
            ? plannedVisitAt
            : throw new InvalidPrescriptionException("L’heure de passage prévue n’est pas valide.");
    }

    private static bool ParseBooleanOrRefuse(string? text, string refusal)
    {
        if (string.IsNullOrEmpty(text))
        {
            return false;
        }

        return bool.TryParse(text, out var value) ? value : throw new InvalidPrescriptionException(refusal);
    }
}

/// <summary>Les champs du formulaire de l'ordonnance du site (cf. <c>PrescriptionUploadRequestSchema</c>), tous en texte ou fichier.</summary>
public sealed class PrescriptionSubmissionForm
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }

    /// <summary>Au format <c>2000-01-31</c>.</summary>
    public string? BirthDate { get; init; }

    public string? Phone { get; init; }

    /// <summary>Facultative : pour prévenir le patient quand c'est prêt.</summary>
    public string? Email { get; init; }

    /// <summary>Date et heure locales de la pharmacie, au format <c>2026-10-25T14:30</c> ; absente : « dès que c'est prêt ».</summary>
    public string? PlannedVisitAt { get; init; }

    /// <summary><c>true</c> ou <c>false</c> ; absent vaut <c>false</c>.</summary>
    public string? HasAlreadyVisited { get; init; }

    /// <summary><c>true</c> ou <c>false</c> ; absent vaut <c>false</c>.</summary>
    public string? IsRenewal { get; init; }

    public string? NoteFromPatient { get; init; }
    public string? SocialSecurityNumber { get; init; }

    /// <summary>La première page de l'ordonnance.</summary>
    public IFormFile? PrescriptionFile { get; init; }

    /// <summary>Les pages suivantes, quand l'ordonnance en a plusieurs.</summary>
    public IReadOnlyList<IFormFile>? AdditionalPrescriptionPages { get; init; }

    public IFormFile? VitalCardPhoto { get; init; }
    public IFormFile? MutualCardFront { get; init; }
    public IFormFile? MutualCardBack { get; init; }
}

/// <summary>
/// Les champs du formulaire de l'ordonnance du site (cf. <c>PrescriptionUploadRequestSchema</c>), et la description de
/// chaque fichier dans l'ordre : la première page, les suivantes, la carte Vitale, puis les deux faces de la mutuelle.
/// </summary>
public sealed class PrescriptionUploadStartForm
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }

    /// <summary>Au format <c>2000-01-31</c>.</summary>
    public string? BirthDate { get; init; }

    public string? Phone { get; init; }
    public string? Email { get; init; }

    /// <summary>Date et heure locales de la pharmacie, au format <c>2026-10-25T14:30</c> ; absente : « dès que c'est prêt ».</summary>
    public string? PlannedVisitAt { get; init; }

    public bool HasAlreadyVisited { get; init; }
    public bool IsRenewal { get; init; }
    public string? NoteFromPatient { get; init; }
    public string? SocialSecurityNumber { get; init; }
    public IReadOnlyList<AnnouncedDocumentForm>? Documents { get; init; }
}

/// <summary>Un fichier que le navigateur va déposer.</summary>
public sealed class AnnouncedDocumentForm
{
    /// <summary><c>prescription</c>, <c>vitalCard</c>, <c>mutualCardFront</c> ou <c>mutualCardBack</c>.</summary>
    public string? Kind { get; init; }

    public long SizeInBytes { get; init; }

    /// <summary>Le type MIME annoncé, vérifié au contenu une fois le fichier déposé.</summary>
    public string? ContentType { get; init; }
}
