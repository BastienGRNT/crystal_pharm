using System.Data.Common;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CrystalPharm.Booking.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Pose le Tenant de la requête pour la Row-Level Security au début de chaque transaction
/// (<c>set_config(…, true)</c>, l'équivalent de <c>SET LOCAL</c>), jamais pour toute la connexion.
/// </summary>
internal sealed class TenantTransactionInterceptor(ITenantContext tenantContext) : DbTransactionInterceptor
{
    public override DbTransaction TransactionStarted(DbConnection connection, TransactionEndEventData eventData, DbTransaction result)
    {
        using var command = CreateSetTenantCommand(connection, result);
        command.ExecuteNonQuery();
        return result;
    }

    public override async ValueTask<DbTransaction> TransactionStartedAsync(
        DbConnection connection,
        TransactionEndEventData eventData,
        DbTransaction result,
        CancellationToken cancellationToken = default)
    {
        await using var command = CreateSetTenantCommand(connection, result);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return result;
    }

    private DbCommand CreateSetTenantCommand(DbConnection connection, DbTransaction transaction)
    {
        var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "select set_config('app.tenant_id', @tenant_id, true)";
        var tenantIdParameter = command.CreateParameter();
        tenantIdParameter.ParameterName = "tenant_id";
        tenantIdParameter.Value = tenantContext.IsResolved ? tenantContext.TenantId.ToString() : string.Empty;
        command.Parameters.Add(tenantIdParameter);
        return command;
    }
}
