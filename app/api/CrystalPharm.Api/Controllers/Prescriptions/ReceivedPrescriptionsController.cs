using CrystalPharm.Api.Authentication;
using CrystalPharm.Prescriptions.Application.Dtos;
using CrystalPharm.Prescriptions.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrystalPharm.Api.Controllers.Prescriptions;

/// <summary>Les ordonnances reçues par la pharmacie du Manager connecté, en lecture seule.</summary>
[ApiController]
[Route("received-prescriptions")]
[Authorize(Policy = ManagerAuthentication.PolicyName)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class ReceivedPrescriptionsController(IPrescriptionSubmissionService submissionService) : ControllerBase
{
    /// <summary>Les envois les plus récents d'abord, sans numéro de sécurité sociale.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ReceivedPrescriptionSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ReceivedPrescriptionSummaryDto>>> List(CancellationToken cancellationToken) =>
        Ok(await submissionService.ListReceivedAsync(cancellationToken));

    [HttpGet("{submissionId:guid}")]
    [ProducesResponseType<ReceivedPrescriptionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReceivedPrescriptionDto>> Find(Guid submissionId, CancellationToken cancellationToken)
    {
        var submission = await submissionService.FindReceivedAsync(submissionId, cancellationToken);
        return submission is null ? NotFound() : Ok(submission);
    }

    /// <summary>Le fichier en flux, affiché dans le navigateur sans être deviné ni mis en cache.</summary>
    [HttpGet("{submissionId:guid}/documents/{documentId:guid}")]
    [Produces("image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> OpenDocument(Guid submissionId, Guid documentId, CancellationToken cancellationToken)
    {
        var document = await submissionService.OpenReceivedDocumentAsync(submissionId, documentId, cancellationToken);
        if (document is null)
        {
            return NotFound();
        }

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(document.Content, document.MimeType);
    }
}
