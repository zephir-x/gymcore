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
            // If the database already has a coach, we assume it's already seeded and skip
            if (await context.Users.AnyAsync(u => u.Role == UserRole.Coach))
            {
                return;
            }
            
            // 1. Subscription Tiers (Basic, Pro, VIP)
            var basicTier = new SubscriptionTier("Basic", 149.99m, 0m);         // 0% discount
            var proTier = new SubscriptionTier("Pro", 199.99m, 0.10m);          // 10% discount on extra services
            var vipTier = new SubscriptionTier("VIP", 259.99m, 0.25m);          // 25% discount on extra services
            
            context.SubscriptionTiers.AddRange(basicTier, proTier, vipTier);
            
            // Rooms & Facilities
            var mainGym = new Room("Main Gym Floor", 100);
            var cardioZone = new Room("Cardio & Fitness Zone", 40);
            var yogaStudio = new Room("Yoga & Pilates Studio", 20);
            var spaSauna = new Room("SPA & Sauna Zone", 15);
            
            context.Rooms.AddRange(mainGym, cardioZone, yogaStudio, spaSauna);
            
            // Users (Admin, Coaches, Members)
            
            // Super Admin
            var admin = new User("admin@gmail.com", passwordHasher.Hash("Admin123!"), UserRole.Admin);
            var adminDetails = new UserDetails(admin.Id, "Kacper", "Gumulak");
            context.Users.Add(admin);
            context.UserDetails.Add(adminDetails);

            // Coaches
            var coach1 = new User("mariusz@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails1 = new UserDetails(coach1.Id, "Mariusz", "Pudzianowski");
            
            var coach2 = new User("ewa@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails2 = new UserDetails(coach2.Id, "Ewa", "Chodakowska");
            
            context.Users.AddRange(coach1, coach2);
            context.UserDetails.AddRange(coachDetails1, coachDetails2);

            // Members (Test Users)
            // Generating 10 sample users for testing purposes
            var firstNames = new[] { "Anna", "Piotr", "Jan", "Maria", "Tomasz", "Katarzyna", "Michal", "Agnieszka", "Krzysztof", "Magdalena" };
            var lastNames = new[] { "Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kowalczyk", "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Wozniak" };

            for (int i = 0; i < 10; i++)
            {
                var member = new User($"member{i + 1}@gmail.com", passwordHasher.Hash("Member123!"), UserRole.Member);
                var memberDetails = new UserDetails(member.Id, firstNames[i], lastNames[i]);
                
                context.Users.Add(member);
                context.UserDetails.Add(memberDetails);
            }
            
            // Group Classes (Schedule)
            var tomorrow = DateTime.UtcNow.AddDays(1).Date;
            
            // Crossfit with Mariusz in the Main Gym
            var crossfitClass = new GroupClass(
                name: "Morning Crossfit", 
                coachId: coach1.Id, 
                roomId: mainGym.Id, 
                startTime: tomorrow.AddHours(8), // 08:00
                endTime: tomorrow.AddHours(9),   // 09:00
                maxAttendees: 15
            );
            
            // Pilates with Ewa in the Yoga Studio
            var pilatesClass = new GroupClass(
                name: "Pilates for Beginners", 
                coachId: coach2.Id, 
                roomId: yogaStudio.Id, 
                startTime: tomorrow.AddHours(10), // 10:00
                endTime: tomorrow.AddHours(11),   // 11:00
                maxAttendees: 20
            );

            context.GroupClasses.AddRange(crossfitClass, pilatesClass);
            
            // Save everything to the database
            await context.SaveChangesAsync();
        }
    }
}