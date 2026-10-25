using System.Diagnostics.CodeAnalysis;

namespace CrystalPharm.Prescriptions.Domain.ValueObjects;

/// <summary>Le format d'un fichier déposé, reconnu à son contenu : le type annoncé par le navigateur ne compte pas.</summary>
public enum DocumentFormat
{
    Jpeg,
    Png,
    Webp,
    Heic,
    Pdf,
}

public static class DocumentFormatDetection
{
    /// <summary>Le nombre d'octets du début d'un fichier qui suffit à reconnaître son format.</summary>
    public const int HeaderLength = 16;

    private static ReadOnlySpan<byte> JpegSignature => [0xFF, 0xD8, 0xFF];

    private static ReadOnlySpan<byte> PngSignature => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    private static readonly string[] HeicBrands = ["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"];

    public static bool TryDetect(ReadOnlySpan<byte> header, [NotNullWhen(true)] out DocumentFormat? format)
    {
        format = null;
        if (header.StartsWith("%PDF-"u8))
        {
            format = DocumentFormat.Pdf;
        }
        else if (header.StartsWith(JpegSignature))
        {
            format = DocumentFormat.Jpeg;
        }
        else if (header.StartsWith(PngSignature))
        {
            format = DocumentFormat.Png;
        }
        else if (header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
        {
            format = DocumentFormat.Webp;
        }
        else if (header.Length >= 12 && header[4..8].SequenceEqual("ftyp"u8) && IsHeicBrand(header[8..12]))
        {
            format = DocumentFormat.Heic;
        }

        return format is not null;
    }

    public static string ToMimeType(this DocumentFormat format) => format switch
    {
        DocumentFormat.Jpeg => "image/jpeg",
        DocumentFormat.Png => "image/png",
        DocumentFormat.Webp => "image/webp",
        DocumentFormat.Heic => "image/heic",
        DocumentFormat.Pdf => "application/pdf",
        _ => throw new ArgumentOutOfRangeException(nameof(format)),
    };

    private static bool IsHeicBrand(ReadOnlySpan<byte> brand)
    {
        foreach (var heicBrand in HeicBrands)
        {
            if (brand.SequenceEqual(System.Text.Encoding.ASCII.GetBytes(heicBrand)))
            {
                return true;
            }
        }

        return false;
    }
}
