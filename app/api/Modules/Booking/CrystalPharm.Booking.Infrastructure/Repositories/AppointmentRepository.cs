using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.Booking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CrystalPharm.Booking.Infrastructure.Repositories;

internal sealed class AppointmentRepository(BookingDbContext context) : IAppointmentRepository
{
    public async Task<IReadOnlyList<Appointment>> ListOfDaysAsync(
        IReadOnlyCollection<DateOnly> days,
        CancellationToken cancellationToken) =>
        await context.ReadInTenantTransactionAsync(
            () => context.Appointments
                .AsNoTracking()
                .Where(appointment => days.Contains(appointment.Day))
                .OrderBy(appointment => appointment.Day)
                .ThenBy(appointment => appointment.StartTime)
                .ToListAsync(cancellationToken),
            cancellationToken);

    public Task<Appointment?> FindAsync(Guid appointmentId, CancellationToken cancellationToken) =>
        context.ReadInTenantTransactionAsync(
            () => context.Appointments.SingleOrDefaultAsync(candidate => candidate.Id == appointmentId, cancellationToken),
            cancellationToken);

    public void Add(Appointment appointment)
    {
        context.Appointments.Add(appointment);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.ExclusionViolation })
        {
            throw new AppointmentSlotAlreadyTakenException(exception);
        }
    }
}
