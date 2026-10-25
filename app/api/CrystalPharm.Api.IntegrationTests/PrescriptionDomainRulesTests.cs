using CrystalPharm.Prescriptions.Domain;
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
}
