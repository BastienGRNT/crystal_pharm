using CrystalPharm.Infrastructure;
using DotNetEnv;

var envFile = new DirectoryInfo(Directory.GetCurrentDirectory());
while (envFile is not null && !File.Exists(Path.Combine(envFile.FullName, ".env")))
{
    envFile = envFile.Parent;
}

if (envFile is not null)
{
    Env.Load(Path.Combine(envFile.FullName, ".env"));
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "CrystalPharm.Auth";
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
