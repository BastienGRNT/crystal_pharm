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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
