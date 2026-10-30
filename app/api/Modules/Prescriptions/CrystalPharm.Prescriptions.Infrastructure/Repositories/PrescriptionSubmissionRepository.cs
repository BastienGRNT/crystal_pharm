using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.Prescriptions.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CrystalPharm.Prescriptions.Infrastructure.Repositories;

internal sealed class PrescriptionSubmissionRepository(PrescriptionsDbContext context) : IPrescriptionSubmissionRepository
{
    public Task<PrescriptionSubmission?> FindByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken) =>
        context.ReadInTenantTransactionAsync(
            () => context.Submissions
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.IdempotencyKey == idempotencyKey, cancellationToken),
            cancellationToken);

    public async Task<IReadOnlyList<PrescriptionSubmission>> ListLatestAsync(int limit, CancellationToken cancellationToken) =>
        await context.ReadInTenantTransactionAsync(
            () => context.Submissions
                .AsNoTracking()
                .Include(submission => submission.Documents)
                .OrderByDescending(submission => submission.SubmittedAt)
                .Take(limit)
                .ToListAsync(cancellationToken),
            cancellationToken);

    public Task<PrescriptionSubmission?> FindAsync(Guid submissionId, CancellationToken cancellationToken) =>
        context.ReadInTenantTransactionAsync(
            () => context.Submissions
                .AsNoTracking()
                .Include(candidate => candidate.Documents)
                .SingleOrDefaultAsync(candidate => candidate.Id == submissionId, cancellationToken),
            cancellationToken);

    public void Add(PrescriptionSubmission submission)
    {
        context.Submissions.Add(submission);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            context.ChangeTracker.Clear();
            throw new DuplicateSubmissionException(exception);
        }
    }
}
