using System.Globalization;
using System.Text;

namespace CrystalPharm.Booking.Application.Services;

/// <summary>L'identifiant opaque d'un créneau : le jour et la plage. La personne qui reçoit est choisie à la réservation.</summary>
internal readonly record struct AppointmentSlotId(DateOnly Day, TimeOnly StartTime, TimeOnly EndTime)
{
    private const string Separator = "|";

    public string Encode() =>
        ToBase64Url(Encoding.UTF8.GetBytes(string.Join(
            Separator,
            Day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            StartTime.ToString("HH:mm", CultureInfo.InvariantCulture),
            EndTime.ToString("HH:mm", CultureInfo.InvariantCulture))));

    public static bool TryDecode(string slotId, out AppointmentSlotId decoded)
    {
        decoded = default;
        try
        {
            var parts = Encoding.UTF8.GetString(FromBase64Url(slotId)).Split(Separator);
            if (parts.Length != 3
                || !DateOnly.TryParseExact(parts[0], "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day)
                || !TimeOnly.TryParseExact(parts[1], "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start)
                || !TimeOnly.TryParseExact(parts[2], "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
            {
                return false;
            }

            decoded = new AppointmentSlotId(day, start, end);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string ToBase64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] FromBase64Url(string text)
    {
        var base64 = text.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '='));
    }
}
