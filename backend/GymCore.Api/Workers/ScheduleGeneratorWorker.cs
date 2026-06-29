using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GymCore.Api.Workers
{
    public class ScheduleGeneratorWorker(
        IServiceProvider serviceProvider, 
        ILogger<ScheduleGeneratorWorker> logger) : BackgroundService
    {
        // Pool of class names to be drawn
        private readonly string[] _classNames = ["HIIT Blast", "Yoga Flow", "CrossFit WOD", "Pilates Core", "Powerlifting 101", "Zumba Relax", "Kettlebell Fight"];
        
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Schedule Generator Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

                    // We are aiming exactly 14 days ahead (rolling window)
                    var targetDate = DateTime.UtcNow.Date.AddDays(14);

                    var alreadyGenerated = await context.GroupClasses
                        .AnyAsync(c => c.StartTime.Date == targetDate, stoppingToken);

                    if (!alreadyGenerated)
                    {
                        logger.LogInformation($"Generating automatic schedule for {targetDate:yyyy-MM-dd}...");
                        await GenerateScheduleForDay(context, targetDate, stoppingToken);
                        logger.LogInformation($"Schedule for {targetDate:yyyy-MM-dd} generated successfully.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred while generating the schedule.");
                }

                // Put the worker to sleep for 12 hours
                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }
        }

        private async Task GenerateScheduleForDay(IApplicationDbContext context, DateTime targetDate, CancellationToken ct)
        {
            var random = new Random();

            var coaches = await context.Users
                .Where(u => u.Role == UserRole.Coach && u.IsActive)
                .ToListAsync(ct);

            var rooms = await context.Rooms.ToListAsync(ct);

            if (!coaches.Any() || !rooms.Any()) return;
            
            // Generating 3 group classes per day
            var classHours = new[] { 17, 18, 19 };

            foreach (var hour in classHours)
            {
                var coach = coaches[random.Next(coaches.Count)];
                var room = rooms[random.Next(rooms.Count)];
                var className = _classNames[random.Next(_classNames.Length)];

                var startTime = targetDate.AddHours(hour);
                var endTime = startTime.AddHours(1);

                var newClass = new GroupClass(
                    name: className,
                    coachId: coach.Id,
                    roomId: room.Id,
                    startTime: startTime,
                    endTime: endTime,
                    maxAttendees: room.MaxCapacity > 0 ? room.MaxCapacity : 15,
                    imageUrl: room.ImageUrl
                );

                context.GroupClasses.Add(newClass);
            }
            
            // Generating 2 slots for each coach per day
            var slotHours = new[] { 10, 12, 14, 16 };

            foreach (var coach in coaches)
            {
                var selectedHours = slotHours.OrderBy(x => random.Next()).Take(2).ToList();

                foreach (var hour in selectedHours)
                {
                    var startTime = targetDate.AddHours(hour);
                    var endTime = startTime.AddHours(1);

                    var newSlot = new TrainerSlot(
                        coachId: coach.Id,
                        startTime: startTime,
                        endTime: endTime
                    );

                    context.TrainerSlots.Add(newSlot);
                }
            }

            await context.SaveChangesAsync(ct);
        }
    }
}