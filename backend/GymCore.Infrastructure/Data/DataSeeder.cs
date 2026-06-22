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
            
            // Subscription Tiers
            var basicTier = new SubscriptionTier("Basic", 149.99m, 0m);         
            var proTier = new SubscriptionTier("Pro", 199.99m, 0.10m);          
            var vipTier = new SubscriptionTier("VIP", 259.99m, 0.25m);          
            
            context.SubscriptionTiers.AddRange(basicTier, proTier, vipTier);
            
            // We save it immediately so that EF Core generates the package GUIDs for Rooms
            await context.SaveChangesAsync();
            
            // Rooms & Facilities
            var mainGym = new Room("Main Gym Floor", 100, null); 
            var functionalZone = new Room("Functional Training Zone", 30, basicTier.Id); 
            var yogaStudio = new Room("Yoga & Pilates Studio", 20, basicTier.Id); 
            var cardioZone = new Room("Cardio & Fitness Zone", 40, proTier.Id); 
            var crossfitBox = new Room("Crossfit Box", 25, proTier.Id); 
            var spaSauna = new Room("SPA & Sauna Zone", 15, vipTier.Id); 
            var recoveryRoom = new Room("Massage & Recovery Room", 5, vipTier.Id); 
            
            context.Rooms.AddRange(mainGym, functionalZone, yogaStudio, cardioZone, crossfitBox, spaSauna, recoveryRoom);
            
            // Users (Admins, Coaches, Members)
            var admin = new User("admin@gmail.com", passwordHasher.Hash("Admin123!"), UserRole.Admin);
            var adminDetails = new UserDetails(admin.Id, "Kacper", "Gumulak");
            context.Users.Add(admin);
            context.UserDetails.Add(adminDetails);

            var coach1 = new User("mariusz@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails1 = new UserDetails(coach1.Id, "Mariusz", "Pudzianowski");
            var coach2 = new User("ewa@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails2 = new UserDetails(coach2.Id, "Ewa", "Chodakowska");
            var coach3 = new User("robert@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails3 = new UserDetails(coach3.Id, "Robert", "Burneika");
            var coach4 = new User("anna@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails4 = new UserDetails(coach4.Id, "Anna", "Lewandowska");
            
            context.Users.AddRange(coach1, coach2, coach3, coach4);
            context.UserDetails.AddRange(coachDetails1, coachDetails2, coachDetails3, coachDetails4);

            var firstNames = new[] { "Anna", "Piotr", "Jan", "Maria", "Tomasz", "Katarzyna", "Michal", "Agnieszka", "Krzysztof", "Magdalena" };
            var lastNames = new[] { "Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kowalczyk", "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Wozniak" };
            var testMembers = new List<User>(); // List for extracting test users

            for (int i = 0; i < 10; i++)
            {
                var member = new User($"member{i + 1}@gmail.com", passwordHasher.Hash("Member123!"), UserRole.Member);
                var memberDetails = new UserDetails(member.Id, firstNames[i], lastNames[i]);
                
                context.Users.Add(member);
                context.UserDetails.Add(memberDetails);
                testMembers.Add(member);
            }
            
            // Group Classes
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            var dayAfter = today.AddDays(2);
            
            var pastClass1 = new GroupClass("Evening Crossfit", coach1.Id, crossfitBox.Id, today.AddDays(-1).AddHours(18), today.AddDays(-1).AddHours(19), 15);
            var pastClass2 = new GroupClass("Morning Stretching", coach4.Id, yogaStudio.Id, today.AddDays(-2).AddHours(8), today.AddDays(-2).AddHours(9), 20);

            var class1 = new GroupClass("Hardcore Bodybuilding", coach3.Id, mainGym.Id, tomorrow.AddHours(10), tomorrow.AddHours(11), 20);
            var class2 = new GroupClass("Pilates for Beginners", coach2.Id, yogaStudio.Id, tomorrow.AddHours(11), tomorrow.AddHours(12), 20);
            var class3 = new GroupClass("Fat Burn Cardio", coach4.Id, cardioZone.Id, tomorrow.AddHours(18), tomorrow.AddHours(19), 25);
            var class4 = new GroupClass("Strongman Training", coach1.Id, functionalZone.Id, dayAfter.AddHours(17), dayAfter.AddHours(18.5), 15);
            var class5 = new GroupClass("Advanced Crossfit", coach1.Id, crossfitBox.Id, dayAfter.AddHours(19), dayAfter.AddHours(20), 12);
            var class6 = new GroupClass("Relaxing Yoga", coach2.Id, yogaStudio.Id, dayAfter.AddHours(20), dayAfter.AddHours(21), 20);

            context.GroupClasses.AddRange(pastClass1, pastClass2, class1, class2, class3, class4, class5, class6);
            
            // We force the classes to be saved so that they receive the correct ID before creating the reservation
            await context.SaveChangesAsync();
            
            // Test cases (for example users buys subscription or makes reservation)
            
            var testUserId = testMembers[0].Id; // We will test on the account: member1@gmail.com
            
            // Subscriptions
            var sub1 = new UserSubscription(testMembers[0].Id, vipTier.Id, today.AddDays(-10), today.AddDays(20)); // Member 1 (VIP)
            var sub2 = new UserSubscription(testMembers[1].Id, proTier.Id, today.AddDays(-5), today.AddDays(25));  // Member 2 (PRO)
            var sub3 = new UserSubscription(testMembers[2].Id, basicTier.Id, today.AddDays(-15), today.AddDays(15)); // Member 3 (BASIC)
            var sub4 = new UserSubscription(testMembers[3].Id, proTier.Id, today.AddDays(-2), today.AddDays(28));  // Member 4 (PRO)
            var sub5 = new UserSubscription(testMembers[4].Id, vipTier.Id, today.AddDays(-20), today.AddDays(10)); // Member 5 (VIP)
            var sub6 = new UserSubscription(testMembers[5].Id, basicTier.Id, today.AddDays(-3), today.AddDays(27));  // Member 6 (BASIC)
            var sub7 = new UserSubscription(testMembers[6].Id, proTier.Id, today.AddDays(-7), today.AddDays(23));  // Member 7 (PRO)
            
            context.UserSubscriptions.AddRange(sub1, sub2, sub3, sub4, sub5, sub6, sub7);
            
            // Trainers and slots 1:1
            var availableSlot1 = new TrainerSlot(coach1.Id, tomorrow.AddHours(14), tomorrow.AddHours(15));
            var availableSlot2 = new TrainerSlot(coach2.Id, dayAfter.AddHours(9), dayAfter.AddHours(10));
            var availableSlot3 = new TrainerSlot(coach4.Id, tomorrow.AddHours(12), tomorrow.AddHours(13));
            var availableSlot4 = new TrainerSlot(coach1.Id, dayAfter.AddHours(12), dayAfter.AddHours(13));
            
            // Slots reserved by different members
            var bookedFutureSlot1 = new TrainerSlot(coach1.Id, tomorrow.AddHours(15), tomorrow.AddHours(16));
            bookedFutureSlot1.Book(testMembers[0].Id); // Member 1 (VIP) makes a reservation with Mariusz

            var bookedFutureSlot2 = new TrainerSlot(coach2.Id, tomorrow.AddHours(17), tomorrow.AddHours(18));
            bookedFutureSlot2.Book(testMembers[1].Id); // Member 2 (PRO) makes a reservation with Ewa

            var bookedPastSlot1 = new TrainerSlot(coach3.Id, today.AddDays(-1).AddHours(10), today.AddDays(-1).AddHours(11));
            bookedPastSlot1.Book(testMembers[0].Id); // Member 1 (VIP) trained with Robert yesterday

            var bookedPastSlot2 = new TrainerSlot(coach4.Id, today.AddDays(-2).AddHours(12), today.AddDays(-2).AddHours(13));
            bookedPastSlot2.Book(testMembers[2].Id); // Member 3 (BASIC) trained with Anna the day before yesterday

            context.TrainerSlots.AddRange(
                availableSlot1, availableSlot2, availableSlot3, availableSlot4, 
                bookedFutureSlot1, bookedFutureSlot2, bookedPastSlot1, bookedPastSlot2
            );
            
            // Class reservations
            
            // Hardcore Bodybuilding (class1) -> 3 participants
            var res1 = new ClassReservation(userId: testMembers[0].Id, groupClassId: class1.Id);
            var res2 = new ClassReservation(userId: testMembers[1].Id, groupClassId: class1.Id);
            var res3 = new ClassReservation(userId: testMembers[2].Id, groupClassId: class1.Id);

            // Pilates for Beginners (class2) -> 3 participants
            var res4 = new ClassReservation(userId: testMembers[3].Id, groupClassId: class2.Id);
            var res5 = new ClassReservation(userId: testMembers[4].Id, groupClassId: class2.Id);
            var res6 = new ClassReservation(userId: testMembers[5].Id, groupClassId: class2.Id);

            // Fat Burn Cardio (class3) -> 2 participants
            var res7 = new ClassReservation(userId: testMembers[0].Id, groupClassId: class3.Id);
            var res8 = new ClassReservation(userId: testMembers[6].Id, groupClassId: class3.Id);

            // Classes finished yesterday (pastClass1) -> 2 participants
            var res9 = new ClassReservation(userId: testMembers[0].Id, groupClassId: pastClass1.Id);
            var res10 = new ClassReservation(userId: testMembers[1].Id, groupClassId: pastClass1.Id);

            context.ClassReservations.AddRange(res1, res2, res3, res4, res5, res6, res7, res8, res9, res10);

            // Final save
            await context.SaveChangesAsync();
        }
    }
}