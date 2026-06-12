using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Entities;
using GymCore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymCore.Infrastructure.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            // We check if we already have a trainer in the database - if so, it means the database is already seeded
            if (await context.Users.AnyAsync(u => u.Role == UserRole.Coach))
            {
                return;
            }

            // We are creating a Trainer
            var coach = new User("coach@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails = new UserDetails(coach.Id, "Mariusz", "Pudzianowski");
            
            context.Users.Add(coach);
            context.UserDetails.Add(coachDetails);

            // 2. Tworzymy Salę
            var room = new Room("Crossfit Zone", 20); // The physical capacity of the room is 20 people
            context.Rooms.Add(room);

            // We create one class for tomorrow
            var tomorrow = DateTime.UtcNow.AddDays(1).Date;
            var groupClass = new GroupClass(
                name: "Morning Crossfit", 
                coachId: coach.Id, 
                roomId: room.Id, 
                startTime: tomorrow.AddHours(8), // 8:00
                endTime: tomorrow.AddHours(9),   // 9:00
                maxAttendees: 2 // Test: Only 2 places available
            );
            
            context.GroupClasses.Add(groupClass);

            // We save everything to the database in one transaction
            await context.SaveChangesAsync();
        }
    }
}