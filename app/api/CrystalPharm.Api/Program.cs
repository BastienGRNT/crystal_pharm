using System.Text.Json;
using System.Text.Json.Serialization;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Api.ErrorHandling;
using CrystalPharm.Api.Tenancy;
using CrystalPharm.Booking.Infrastructure;
using CrystalPharm.Prescriptions.Infrastructure;
using CrystalPharm.SharedKernel.Tenancy;
using DotNetEnv;

var envFile = new DirectoryInfo(Directory.GetCurrentDirectory());
while (envFile is not null && !File.Exists(Path.Combine(envFile.FullName, ".env")))
{
    envFile = envFile.Parent;
}

if (envFile is not null)
{
    // Une variable déjà posée (la production, les tests) l'emporte sur le fichier .env.
    Env.Load(Path.Combine(envFile.FullName, ".env"), new LoadOptions(clobberExistingVars: false));
}

var builder = WebApplication.CreateBuilder(args);

var camelCaseEnums = new JsonStringEnumConverter(JsonNamingPolicy.CamelCase);
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(camelCaseEnums));
// Lues par le document OpenAPI : le contrat décrit les mêmes valeurs que les réponses.
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(camelCaseEnums));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainRuleExceptionHandler>();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<RequestTenantContext>();
builder.Services.AddScoped<ITenantContext>(services => services.GetRequiredService<RequestTenantContext>());
builder.Services.AddManagerAuthentication(builder.Configuration, builder.Environment);
builder.Services.AddSiteServiceAuthentication(builder.Configuration);
builder.Services.AddPrescriptionRateLimiting();
builder.Services.AddBookingModule(builder.Configuration);
builder.Services.AddPrescriptionsModule(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    await app.Services.ApplyBookingMigrationsAsync(CancellationToken.None);
    await app.Services.ApplyPrescriptionsMigrationsAsync(CancellationToken.None);
}

app.UseExceptionHandler();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();

// Pour WebApplicationFactory<Program> dans les tests d'intégration.
public partial class Program;
