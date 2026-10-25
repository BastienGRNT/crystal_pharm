using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.Prescriptions.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CrystalPharm.Prescriptions.Infrastructure.Repositories;

internal sealed class PrescriptionSubmissionRepository(PrescriptionsDbContext context) : IPrescriptionSubmissionRepository
{
    public async Task<PrescriptionSubmission?> FindByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken)
    {
        // Une lecture seule ne crée pas de transaction : on en ouvre une pour que la
        // Row-Level Security connaisse le Tenant (cf. TenantTransactionInterceptor).
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var submission = await context.Submissions
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.IdempotencyKey == idempotencyKey, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return submission;
    }

    public async Task<IReadOnlyList<PrescriptionSubmission>> ListLatestAsync(int limit, CancellationToken cancellationToken)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var submissions = await context.Submissions
            .AsNoTracking()
            .Include(submission => submission.Documents)
            .OrderByDescending(submission => submission.SubmittedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return submissions;
    }

    public async Task<PrescriptionSubmission?> FindAsync(Guid submissionId, CancellationToken cancellationToken)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var submission = await context.Submissions
            .AsNoTracking()
            .Include(candidate => candidate.Documents)
            .SingleOrDefaultAsync(candidate => candidate.Id == submissionId, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return submission;
    }

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
