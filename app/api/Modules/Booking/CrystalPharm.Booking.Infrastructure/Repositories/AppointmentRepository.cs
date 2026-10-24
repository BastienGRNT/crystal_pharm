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
        CancellationToken cancellationToken)
    {
        // Une lecture seule ne crée pas de transaction : on en ouvre une pour que la
        // Row-Level Security connaisse le Tenant (cf. TenantTransactionInterceptor).
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var appointments = await context.Appointments
            .AsNoTracking()
            .Where(appointment => days.Contains(appointment.Day))
            .OrderBy(appointment => appointment.Day)
            .ThenBy(appointment => appointment.StartTime)
            .ToListAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return appointments;
    }

    public async Task<Appointment?> FindAsync(Guid appointmentId, CancellationToken cancellationToken)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var appointment = await context.Appointments
            .SingleOrDefaultAsync(candidate => candidate.Id == appointmentId, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return appointment;
    }

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
