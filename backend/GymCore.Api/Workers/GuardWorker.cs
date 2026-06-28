using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Api.Workers
{
    public class GuardWorker(IServiceScopeFactory scopeFactory, ILogger<GuardWorker> logger) : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Guard Worker running. Checking database in the background...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // We create a "dummy" scope to safely retrieve the IApplicationDbContext
                    using var scope = scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                    var now = DateTime.UtcNow;

                    // Subscription expiration
                    var expiredSubscriptions = await context.UserSubscriptions
                        .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate <= now)
                        .ToListAsync(stoppingToken);

                    foreach (var sub in expiredSubscriptions)
                    {
                        sub.Expire();
                        logger.LogInformation($"Subscription {sub.Id} for user {sub.UserId} has been expired.");
                    }

                    // Closing the 1:1 session with the Trainer
                    var completedSlots = await context.TrainerSlots
                        .Where(s => s.Status == SlotStatus.Booked && s.EndTime <= now)
                        .ToListAsync(stoppingToken);

                    foreach (var slot in completedSlots)
                    {
                        slot.MarkAsCompleted();
                        logger.LogInformation($"Session 1:1 (Slot {slot.Id}) has been marked as completed.");
                    }

                    // We save changes if anything has been modified
                    if (expiredSubscriptions.Any() || completedSlots.Any())
                    {
                        await context.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred in the Guard Worker.");
                }

                // Wait an hour before checking again
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}