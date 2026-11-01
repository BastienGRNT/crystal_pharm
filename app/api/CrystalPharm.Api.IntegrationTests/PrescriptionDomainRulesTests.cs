using CrystalPharm.Prescriptions.Domain;
using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.Prescriptions.Domain.ValueObjects;

namespace CrystalPharm.Api.IntegrationTests;

public sealed class PrescriptionDomainRulesTests
{
    [Theory]
    [InlineData("185057800608491")]
    [InlineData("1 85 05 78 006 084 91")]
    public void A_social_security_number_with_a_right_key_is_accepted_without_spaces(string typed)
    {
        Assert.Equal("185057800608491", new SocialSecurityNumber(typed).Value);
    }

    [Theory]
    [InlineData("185057800608490")]
    [InlineData("98505780060849")]
    [InlineData("not a number")]
    public void A_malformed_social_security_number_is_refused(string typed)
    {
        Assert.Throws<InvalidPrescriptionException>(() => new SocialSecurityNumber(typed));
    }

    [Theory]
    [InlineData(new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }, DocumentFormat.Jpeg)]
    [InlineData(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0 }, DocumentFormat.Png)]
    [InlineData(new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31 }, DocumentFormat.Pdf)]
    public void A_format_is_recognised_by_its_content(byte[] header, DocumentFormat expected)
    {
        Assert.True(DocumentFormatDetection.TryDetect(header, out var format));
        Assert.Equal(expected, format);
    }

    [Fact]
    public void A_future_birth_date_is_refused()
    {
        Assert.Throws<InvalidPrescriptionException>(() =>
            new PatientIdentity("Camille", "Durand", new DateOnly(2030, 1, 1), "06 12 34 56 78", new DateOnly(2026, 10, 25)));
    }

    [Theory]
    [InlineData("camille@example.org")]
    [InlineData(" Camille@Example.ORG ")]
    public void An_email_is_kept_trimmed_and_in_lower_case(string typed)
    {
        Assert.Equal("camille@example.org", new PatientEmail(typed).Value);
    }

    [Theory]
    [InlineData("camille")]
    [InlineData("camille@example")]
    [InlineData("camille @example.org")]
    public void A_malformed_email_is_refused(string typed)
    {
        Assert.Throws<InvalidPrescriptionException>(() => new PatientEmail(typed));
    }

    [Fact]
    public void A_note_longer_than_allowed_is_refused()
    {
        Assert.Throws<InvalidPrescriptionException>(() =>
            new SubmissionRequest(null, false, false, new string('a', SubmissionRequest.MaximumNoteLength + 1)));
    }

    [Theory]
    [InlineData(91, PrescriptionStatus.Received, 0, true)]
    [InlineData(10, PrescriptionStatus.Collected, 31, true)]
    [InlineData(10, PrescriptionStatus.Collected, 5, false)]
    [InlineData(60, PrescriptionStatus.Ready, 50, false)]
    public void A_submission_is_kept_a_month_after_collection_and_three_months_at_most(
        int daysSinceSubmission,
        PrescriptionStatus status,
        int daysSinceStatusChange,
        bool expectedPastRetention)
    {
        var now = new DateTimeOffset(2026, 10, 31, 12, 0, 0, TimeSpan.Zero);
        var submission = SubmissionReceivedOn(now.AddDays(-daysSinceSubmission));
        submission.MoveTo(status, null, now.AddDays(-daysSinceStatusChange));

        Assert.Equal(expectedPastRetention, submission.IsPastRetention(now));
    }

    private static PrescriptionSubmission SubmissionReceivedOn(DateTimeOffset submittedAt) =>
        PrescriptionSubmission.Submit(
            "key",
            new PatientIdentity("Camille", "Durand", new DateOnly(1985, 5, 17), "06 12 34 56 78", DateOnly.FromDateTime(submittedAt.UtcDateTime)),
            null,
            new SubmissionRequest(null, false, false, null),
            null,
            [new DocumentDraft(DocumentKind.Prescription, DocumentFormat.Pdf, 10)],
            submittedAt);
}
