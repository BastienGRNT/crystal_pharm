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
    private const long MaximumRequestSizeInBytes = 5 * SubmittedDocument.MaximumSizeInBytes + 1024 * 1024;

    /// <summary>
    /// Reçoit une ordonnance et, si le patient les a jointes, sa carte Vitale et sa mutuelle. L'en-tête
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
        ParsePlannedVisitOrRefuse(form.PlannedVisitAt),
        ParseBooleanOrRefuse(form.HasAlreadyVisited),
        form.SocialSecurityNumber,
        IncomingDocumentsOf(form));

    private static IReadOnlyCollection<IncomingDocument> IncomingDocumentsOf(PrescriptionSubmissionForm form)
    {
        var files = new (DocumentKind Kind, IFormFile? File)[]
        {
            (DocumentKind.Prescription, form.PrescriptionFile),
            (DocumentKind.VitalCard, form.VitalCardPhoto),
            (DocumentKind.MutualCardFront, form.MutualCardFront),
            (DocumentKind.MutualCardBack, form.MutualCardBack),
        };
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

    private static DateTime ParsePlannedVisitOrRefuse(string? text) =>
        DateTime.TryParseExact(text, "yyyy-MM-dd'T'HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var plannedVisitAt)
            ? plannedVisitAt
            : throw new InvalidPrescriptionException("L’heure de passage prévue n’est pas valide.");

    private static bool ParseBooleanOrRefuse(string? text) =>
        string.IsNullOrEmpty(text) || (bool.TryParse(text, out var value)
            ? value
            : throw new InvalidPrescriptionException("Le choix « déjà venu » n’est pas valide."));
}

/// <summary>Les champs du formulaire de l'ordonnance du site (cf. <c>PrescriptionUploadRequestSchema</c>), tous en texte ou fichier.</summary>
public sealed class PrescriptionSubmissionForm
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }

    /// <summary>Au format <c>2000-01-31</c>.</summary>
    public string? BirthDate { get; init; }

    public string? Phone { get; init; }

    /// <summary>Date et heure locales de la pharmacie, au format <c>2026-10-25T14:30</c>.</summary>
    public string? PlannedVisitAt { get; init; }

    /// <summary><c>true</c> ou <c>false</c> ; absent vaut <c>false</c>.</summary>
    public string? HasAlreadyVisited { get; init; }

    public string? SocialSecurityNumber { get; init; }
    public IFormFile? PrescriptionFile { get; init; }
    public IFormFile? VitalCardPhoto { get; init; }
    public IFormFile? MutualCardFront { get; init; }
    public IFormFile? MutualCardBack { get; init; }
}
