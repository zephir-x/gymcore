using System.Text;
using FluentValidation;
using GymCore.Application.Common.Behaviors;
using Microsoft.EntityFrameworkCore;
using GymCore.Infrastructure.Data;
using GymCore.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Stripe;

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

// JWT Token Generator Registration
builder.Services.AddSingleton<IJwtTokenGenerator, GymCore.Infrastructure.Identity.JwtTokenGenerator>();

// JWT Authentication Registration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true, // Checks if the token has not expired
            ValidateIssuerSigningKey = true, // Verifies the signature (whether no one has forged the token)
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!))
        };
    });

builder.Services.AddAuthorization(); // Registers services that allow the use of the [Authorize] attribute

// We automatically register all validators from the Application project
builder.Services.AddValidatorsFromAssembly(typeof(IApplicationDbContext).Assembly);

// MediatR Registration
// Scans the Application project and automatically registers all Handlers
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(IApplicationDbContext).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>)); // Embeds validation into every command
});

// We are adding support for controllers
builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// Add services to the container
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Registration for Stripe
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"] ?? throw new InvalidOperationException("Stripe:SecretKey is missing in configuration");
builder.Services.AddScoped<GymCore.Application.Common.Services.StripePaymentService>();

// Registration for GuardWorker who looks for status modyfications
builder.Services.AddHostedService<GymCore.Api.Workers.GuardWorker>();

// Registration for ScheduleWorker who looks for new activities on platform
builder.Services.AddHostedService<GymCore.Api.Workers.ScheduleGeneratorWorker>();

var app = builder.Build();

// Seeding the database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    
    // Automatic migration application at application startup
    await context.Database.MigrateAsync(); 
    
    // We are launching Seeder
    await DatabaseSeeder.SeedAsync(context, passwordHasher);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(builder => builder.WithOrigins("http://localhost:5173").AllowAnyMethod().AllowAnyHeader());

app.UseHttpsRedirection();

app.UseAuthentication(); // Checks who you are (decodes the token)
app.UseAuthorization();  // Checks if you have permissions to this endpoint
app.UseMiddleware<GymCore.Api.Middleware.ActiveUserCheckMiddleware>();

// We map HTTP paths to our Controllers
app.MapControllers();

app.Run();