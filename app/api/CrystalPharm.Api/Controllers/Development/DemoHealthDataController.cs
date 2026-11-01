using System.Text;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Prescriptions.Application.Dtos;
using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrystalPharm.Api.Controllers.Development;

/// <param name="EmployeeIds">Les Employees qui reçoivent les rendez-vous : le C# ne connaît pas l'équipe.</param>
public sealed record DemoHealthDataRequest(IReadOnlyList<Guid> EmployeeIds);

public sealed record DemoHealthDataSummary(int AppointmentCount, int PrescriptionCount);

/// <summary>
/// Les rendez-vous et ordonnances de démonstration du Tenant du Manager connecté, pour l'outil de dev.
/// Tout passe par les services d'<c>Application</c>, comme un vrai envoi : jamais d'écriture directe en base.
/// Hors du contrat (absent de l'OpenAPI) et introuvable hors développement.
/// </summary>
[ApiController]
[Route("development/demo-health-data")]
[Authorize(Policy = ManagerAuthentication.PolicyName)]
[ApiExplorerSettings(IgnoreApi = true)]
[DevelopmentOnly]
public sealed class DemoHealthDataController(
    IAppointmentConfigurationService appointmentConfigurationService,
    IAppointmentService appointmentService,
    IVisitorAppointmentService visitorAppointmentService,
    IPrescriptionSubmissionService prescriptionSubmissionService,
    TimeProvider timeProvider) : ControllerBase
{
    private static readonly TimeZoneInfo PharmacyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Paris");
    private const int VisitorRequestSearchDays = 21;

    private static readonly DemoPatient[] DemoPatients =
    [
        new("Marie", "Dubois", new DateOnly(1958, 3, 14), "06 12 34 56 78", "marie.dubois@patient.demo.crystal-pharm.test"),
        new("Jean", "Martin", new DateOnly(1971, 9, 2), "06 23 45 67 89", null),
        new("Nadia", "Benali", new DateOnly(1989, 12, 21), "07 34 56 78 90", "nadia.benali@patient.demo.crystal-pharm.test"),
        new("Lucas", "Petit", new DateOnly(2004, 6, 30), "06 45 67 89 01", null),
        new("Odile", "Moreau", new DateOnly(1946, 1, 8), "04 72 11 22 33", null),
        new("Karim", "Haddad", new DateOnly(1980, 5, 17), "06 56 78 90 12", "karim.haddad@patient.demo.crystal-pharm.test"),
    ];

    /// <summary>Remplace la configuration des rendez-vous, puis ajoute des rendez-vous et des ordonnances dans tous les états.</summary>
    [HttpPost]
    public async Task<ActionResult<DemoHealthDataSummary>> Seed(DemoHealthDataRequest request, CancellationToken cancellationToken)
    {
        if (request.EmployeeIds.Count == 0)
        {
            return Problem(title: "Équipe vide", detail: "Il faut au moins une personne de l’équipe.", statusCode: StatusCodes.Status400BadRequest);
        }

        var configuration = await appointmentConfigurationService.ReplaceAsync(BuildDemoConfiguration(request.EmployeeIds), cancellationToken);
        var appointmentCount = await ScheduleTeamAppointmentsAsync(request.EmployeeIds, configuration, cancellationToken)
            + await RequestVisitorAppointmentsAsync(configuration, requestCount: 3, cancellationToken);
        var prescriptionCount = await SubmitPrescriptionsInEveryStatusAsync(cancellationToken);
        return Ok(new DemoHealthDataSummary(appointmentCount, prescriptionCount));
    }

    /// <summary>Une demande de rendez-vous, comme si un patient venait de la faire sur le site.</summary>
    [HttpPost("visitor-appointment")]
    public async Task<ActionResult<DemoHealthDataSummary>> RequestOneVisitorAppointment(CancellationToken cancellationToken)
    {
        var configuration = await appointmentConfigurationService.GetAsync(cancellationToken);
        var appointmentCount = await RequestVisitorAppointmentsAsync(configuration, requestCount: 1, cancellationToken);
        return appointmentCount == 0
            ? Problem(title: "Aucun créneau libre", detail: "Aucun motif ouvert n’a de créneau libre dans les trois semaines.", statusCode: StatusCodes.Status409Conflict)
            : Ok(new DemoHealthDataSummary(appointmentCount, 0));
    }

    /// <summary>Une ordonnance, comme si un patient venait de l'envoyer depuis le site.</summary>
    [HttpPost("prescription")]
    public async Task<ActionResult<DemoHealthDataSummary>> SubmitOnePrescription(CancellationToken cancellationToken)
    {
        var patient = DemoPatients[Random.Shared.Next(DemoPatients.Length)];
        await SubmitPrescriptionAsync(patient, isRenewal: true, hasAlreadyVisited: true, noteFromPatient: null, cancellationToken);
        return Ok(new DemoHealthDataSummary(0, 1));
    }

    private static AppointmentConfigurationDto BuildDemoConfiguration(IReadOnlyList<Guid> employeeIds) =>
        new(
            new AppointmentSettingsDto(
                IsBookingOpen: true,
                ConfirmsAutomatically: false,
                SlotStepMinutes: 15,
                MinimumNoticeMinutes: 120,
                MaximumAdvanceDays: 30,
                BufferMinutes: 5,
                ConfirmationMessage: "Merci d’apporter votre carte Vitale et votre carte de mutuelle."),
            [
                new AppointmentReasonDto(Guid.NewGuid(), "Vaccination antigrippale", "Pour les adultes, avec ou sans bon de la CPAM.", "Venez avec votre carnet de vaccination si vous l’avez.", 15, true),
                new AppointmentReasonDto(Guid.NewGuid(), "Test angine", "Un test rapide, résultat en 10 minutes.", null, 15, true),
                new AppointmentReasonDto(Guid.NewGuid(), "Entretien pharmaceutique", "Pour faire le point sur un traitement au long cours.", "Apportez vos dernières ordonnances.", 30, true),
                new AppointmentReasonDto(Guid.NewGuid(), "Bilan de médication", "Pour les patients de plus de 65 ans qui prennent au moins cinq médicaments.", null, 45, false),
            ],
            employeeIds.Take(3).SelectMany(DemoWeeklyWindowsOf).ToArray(),
            []);

    private static IEnumerable<WeeklyAvailabilityWindowDto> DemoWeeklyWindowsOf(Guid employeeId)
    {
        for (var isoDayOfWeek = 1; isoDayOfWeek <= 5; isoDayOfWeek++)
        {
            yield return new WeeklyAvailabilityWindowDto(employeeId, isoDayOfWeek, new TimeOnly(9, 0), new TimeOnly(12, 0));
            yield return new WeeklyAvailabilityWindowDto(employeeId, isoDayOfWeek, new TimeOnly(14, 0), new TimeOnly(18, 30));
        }

        yield return new WeeklyAvailabilityWindowDto(employeeId, 6, new TimeOnly(9, 0), new TimeOnly(12, 30));
    }

    /// <summary>Des rendez-vous posés par l'équipe : hier (l'historique), aujourd'hui, demain, et un annulé.</summary>
    private async Task<int> ScheduleTeamAppointmentsAsync(
        IReadOnlyList<Guid> employeeIds,
        AppointmentConfigurationDto configuration,
        CancellationToken cancellationToken)
    {
        var today = TodayAtThePharmacy();
        var activeReasons = configuration.Reasons.Where(reason => reason.IsActive).ToArray();
        var plannedAppointments = new (int DayOffset, TimeOnly StartTime, int PatientIndex, bool IsCancelled)[]
        {
            (-1, new TimeOnly(9, 30), 4, false),
            (-1, new TimeOnly(15, 0), 1, false),
            (0, new TimeOnly(10, 0), 0, false),
            (0, new TimeOnly(16, 15), 5, false),
            (1, new TimeOnly(11, 0), 2, true),
            (2, new TimeOnly(14, 30), 3, false),
        };

        var scheduledCount = 0;
        for (var index = 0; index < plannedAppointments.Length; index++)
        {
            var (dayOffset, startTime, patientIndex, isCancelled) = plannedAppointments[index];
            var reason = activeReasons[index % activeReasons.Length];
            var patient = DemoPatients[patientIndex];
            var schedulingResult = await appointmentService.ScheduleAsync(
                new NewAppointmentDto(
                    employeeIds[index % employeeIds.Count],
                    today.AddDays(dayOffset),
                    startTime,
                    startTime.AddMinutes(reason.DurationMinutes),
                    $"{patient.FirstName} {patient.LastName}",
                    patient.Phone,
                    reason.Label,
                    reason.Id,
                    Note: null,
                    ConfirmImmediately: true,
                    patient.Email),
                cancellationToken);

            if (schedulingResult is not AppointmentSchedulingResult.Scheduled scheduled)
            {
                continue;
            }

            if (isCancelled)
            {
                await appointmentService.CancelAsync(scheduled.Appointment.Id, cancellationToken);
            }

            scheduledCount++;
        }

        return scheduledCount;
    }

    /// <summary>Des demandes en attente, sur de vrais créneaux libres : la même route qu'un patient sur le site.</summary>
    private async Task<int> RequestVisitorAppointmentsAsync(
        AppointmentConfigurationDto configuration,
        int requestCount,
        CancellationToken cancellationToken)
    {
        var activeReasons = configuration.Reasons.Where(reason => reason.IsActive).ToArray();
        if (activeReasons.Length == 0)
        {
            return 0;
        }

        var today = TodayAtThePharmacy();
        var requestedCount = 0;
        for (var attempt = 0; attempt < requestCount * 3 && requestedCount < requestCount; attempt++)
        {
            var reason = activeReasons[Random.Shared.Next(activeReasons.Length)];
            var availableDays = await visitorAppointmentService.ListAvailableDaysAsync(reason.Id, today, today.AddDays(VisitorRequestSearchDays), cancellationToken);
            if (availableDays.Count == 0)
            {
                continue;
            }

            var day = availableDays[Random.Shared.Next(Math.Min(availableDays.Count, 6))].Day;
            var slots = await visitorAppointmentService.ListAvailableSlotsAsync(reason.Id, day, cancellationToken);
            if (slots.Count == 0)
            {
                continue;
            }

            var patient = DemoPatients[Random.Shared.Next(DemoPatients.Length)];
            var requestResult = await visitorAppointmentService.RequestAsync(
                new VisitorAppointmentRequestDto(
                    slots[Random.Shared.Next(slots.Count)].SlotId,
                    reason.Id,
                    patient.FirstName,
                    patient.LastName,
                    patient.Phone,
                    "Demande faite depuis l’outil de dev.",
                    patient.Email),
                cancellationToken);

            if (requestResult is VisitorAppointmentResult.Requested)
            {
                requestedCount++;
            }
        }

        return requestedCount;
    }

    /// <summary>Six envois, de « reçue » à « retirée » : de quoi tester chaque étape du suivi.</summary>
    private async Task<int> SubmitPrescriptionsInEveryStatusAsync(CancellationToken cancellationToken)
    {
        var plannedPrescriptions = new (int PatientIndex, bool IsRenewal, bool HasAlreadyVisited, string? NoteFromPatient, PrescriptionStatus Status, string? TeamNote)[]
        {
            (0, true, true, "Je passe demain matin, merci !", PrescriptionStatus.Received, null),
            (1, false, false, null, PrescriptionStatus.Received, null),
            (2, true, true, null, PrescriptionStatus.InPreparation, "Générique accepté par la patiente."),
            (3, false, false, "C’est pour mon fils.", PrescriptionStatus.WaitingForProducts, "Commandé chez le grossiste, arrivée prévue."),
            (4, true, true, null, PrescriptionStatus.Ready, null),
            (5, true, true, null, PrescriptionStatus.Collected, null),
        };

        foreach (var (patientIndex, isRenewal, hasAlreadyVisited, noteFromPatient, status, teamNote) in plannedPrescriptions)
        {
            var submissionId = await SubmitPrescriptionAsync(DemoPatients[patientIndex], isRenewal, hasAlreadyVisited, noteFromPatient, cancellationToken);
            if (status != PrescriptionStatus.Received)
            {
                var expectedProductsOn = status == PrescriptionStatus.WaitingForProducts ? TodayAtThePharmacy().AddDays(2) : (DateOnly?)null;
                await prescriptionSubmissionService.ChangeStatusAsync(submissionId, new PrescriptionStatusChangeDto(status, expectedProductsOn), cancellationToken);
            }

            if (teamNote is not null)
            {
                await prescriptionSubmissionService.WriteTeamNoteAsync(submissionId, new PrescriptionTeamNoteDto(teamNote), cancellationToken);
            }
        }

        return plannedPrescriptions.Length;
    }

    private async Task<Guid> SubmitPrescriptionAsync(
        DemoPatient patient,
        bool isRenewal,
        bool hasAlreadyVisited,
        string? noteFromPatient,
        CancellationToken cancellationToken)
    {
        var documents = new List<IncomingDocument>
        {
            DemoDocument(DocumentKind.Prescription, $"Ordonnance de démonstration — {patient.FirstName} {patient.LastName}"),
        };
        if (!hasAlreadyVisited)
        {
            documents.Add(DemoDocument(DocumentKind.VitalCard, $"Carte Vitale de démonstration — {patient.FirstName} {patient.LastName}"));
            documents.Add(DemoDocument(DocumentKind.MutualCardFront, "Carte de mutuelle de démonstration (recto)"));
        }

        var submissionResult = await prescriptionSubmissionService.SubmitAsync(
            new NewPrescriptionSubmissionDto(
                Guid.NewGuid().ToString("N"),
                patient.FirstName,
                patient.LastName,
                patient.BirthDate,
                patient.Phone,
                patient.Email,
                PlannedVisitAt: TodayAtThePharmacy().AddDays(1).ToDateTime(new TimeOnly(10, 0)),
                hasAlreadyVisited,
                isRenewal,
                noteFromPatient,
                SocialSecurityNumber: null,
                documents),
            cancellationToken);
        return submissionResult.SubmissionId;
    }

    private static IncomingDocument DemoDocument(DocumentKind kind, string text)
    {
        var content = BuildOnePagePdf(text);
        return new IncomingDocument(kind, content.Length, () => new MemoryStream(content, writable: false));
    }

    /// <summary>Un PDF d'une page avec une ligne de texte, ses offsets calculés pour que tout lecteur l'ouvre.</summary>
    private static byte[] BuildOnePagePdf(string text)
    {
        // Helvetica n'a que les caractères latins de base : l'aperçu reste lisible sans police embarquée.
        var asciiText = new string(text.Normalize(NormalizationForm.FormD)
            .Where(character => character < 128)
            .Select(character => character is '(' or ')' or '\\' ? ' ' : character)
            .ToArray());
        var pageContent = $"BT /F1 18 Tf 60 760 Td ({asciiText}) Tj ET";
        string[] objects =
        [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            $"<< /Length {pageContent.Length} >>\nstream\n{pageContent}\nendstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        ];

        var pdf = new StringBuilder("%PDF-1.4\n");
        var objectOffsets = new List<int>();
        for (var index = 0; index < objects.Length; index++)
        {
            objectOffsets.Add(pdf.Length);
            pdf.Append($"{index + 1} 0 obj\n{objects[index]}\nendobj\n");
        }

        var crossReferenceOffset = pdf.Length;
        pdf.Append($"xref\n0 {objects.Length + 1}\n0000000000 65535 f \n");
        foreach (var objectOffset in objectOffsets)
        {
            pdf.Append($"{objectOffset:D10} 00000 n \n");
        }

        pdf.Append($"trailer\n<< /Size {objects.Length + 1} /Root 1 0 R >>\nstartxref\n{crossReferenceOffset}\n%%EOF\n");
        return Encoding.ASCII.GetBytes(pdf.ToString());
    }

    private DateOnly TodayAtThePharmacy() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), PharmacyTimeZone).DateTime);

    private sealed record DemoPatient(string FirstName, string LastName, DateOnly BirthDate, string Phone, string? Email);
}
