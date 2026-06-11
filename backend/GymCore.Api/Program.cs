using FluentValidation;
using GymCore.Application.Common.Behaviors;
using Microsoft.EntityFrameworkCore;
using GymCore.Infrastructure.Data;
using GymCore.Application.Common.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Database registration
// We get the Connection String from appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Since our DbContext is in the Infrastructure project, we need to indicate
// where EF Core should look for and save migration files
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("GymCore.Infrastructure")));

// Binding the interface to the implementation for Dependency Injection
builder.Services.AddScoped<IApplicationDbContext>(provider => 
    provider.GetRequiredService<ApplicationDbContext>());

// Password Hasher Registration
builder.Services.AddSingleton<IPasswordHasher, GymCore.Infrastructure.Identity.PasswordHasher>();

// We automatically register all validators from the Application project
builder.Services.AddValidatorsFromAssembly(typeof(IApplicationDbContext).Assembly);

// MediatR Registration
// Scans the Application project and automatically registers all Handlers
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(IApplicationDbContext).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>)); // Embeds validation into every command
});

// We are adding support for controllers
builder.Services.AddControllers();

// Add services to the container
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// We map HTTP paths to our Controllers
app.MapControllers();

app.Run();