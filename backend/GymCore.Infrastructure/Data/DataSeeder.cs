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
            // Abort if database is already seeded
            if (await context.Users.AnyAsync(u => u.Role == UserRole.Coach)) return;
            
            // Subscription Tiers
            var basicTier = new SubscriptionTier("Basic", 149.99m);         
            var proTier = new SubscriptionTier("Pro", 199.99m);          
            var vipTier = new SubscriptionTier("VIP", 259.99m);          
            
            context.SubscriptionTiers.AddRange(basicTier, proTier, vipTier);
            await context.SaveChangesAsync();
            
            // Rooms & Facilities
            var mainGym = new Room("Main Gym Floor", 100, "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop", basicTier.Id, "The heart of GymCore. Packed with premium free weights, benches, and resistance machines designed for all levels of strength training."); 
            var functionalZone = new Room("Functional Training Zone", 30, "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1500&auto=format&fit=crop", basicTier.Id, "A dynamic space for kettlebells, battle ropes, and calisthenics to build explosive power and agility."); 
            var yogaStudio = new Room("Yoga & Pilates Studio", 20, "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1470&auto=format&fit=crop", basicTier.Id, "Find your zen. A quiet, climate-controlled studio perfect for mindfulness, stretching, and deep core work."); 
            var cardioZone = new Room("Cardio & Fitness Zone", 40, "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop", proTier.Id, "Elevate your heart rate with our state-of-the-art treadmills, ellipticals, and stair climbers overlooking the city."); 
            var crossfitBox = new Room("Crossfit Box", 25, "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop", proTier.Id, "A dedicated, heavy-duty arena for WODs, featuring rigs, olympic platforms, and endless chalk."); 
            var spaSauna = new Room("SPA & Sauna Zone", 15, "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1470&auto=format&fit=crop", vipTier.Id, "Exclusive recovery area. Detoxify and relax your muscles after an intense session in our premium cedar saunas."); 
            var recoveryRoom = new Room("Massage & Recovery Room", 5, "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?q=80&w=1632&auto=format&fit=crop", vipTier.Id, "Professional massage tables and physical therapy equipment for optimal regeneration and injury prevention."); 
            
            context.Rooms.AddRange(mainGym, functionalZone, yogaStudio, cardioZone, crossfitBox, spaSauna, recoveryRoom);
            
            // Admin & Coaches
            var admin = new User("admin@gmail.com", passwordHasher.Hash("Admin123!"), UserRole.Admin);
            var adminDetails = new UserDetails(admin.Id, "Kacper", "Gumulak");
            adminDetails.UpdateProfile("Kacper", "Gumulak", "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=f97316", "Platform Administrator. Overseeing operations and infrastructure.");
            context.Users.Add(admin);
            context.UserDetails.Add(adminDetails);

            var coach1 = new User("mariusz@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails1 = new UserDetails(coach1.Id, "Mariusz", "Pudzianowski");
            coachDetails1.UpdateProfile("Mariusz", "Pudzianowski", "https://api.dicebear.com/7.x/avataaars/svg?seed=Mariusz&backgroundColor=3b82f6", "Polish Strongman legend, ready to build your absolute physical strength.");
            
            var coach2 = new User("ewa@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails2 = new UserDetails(coach2.Id, "Ewa", "Chodakowska");
            coachDetails2.UpdateProfile("Ewa", "Chodakowska", "https://api.dicebear.com/7.x/avataaars/svg?seed=Ewa&backgroundColor=10b981", "Expert in holistic fitness, mobility routines, and healthy lifestyle changes.");
            
            var coach3 = new User("robert@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails3 = new UserDetails(coach3.Id, "Robert", "Burneika");
            coachDetails3.UpdateProfile("Robert", "Burneika", "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=f43f5e", "Hardcore bodybuilding coach. No excuses, only results.");
            
            var coach4 = new User("anna@gmail.com", passwordHasher.Hash("Coach123!"), UserRole.Coach);
            var coachDetails4 = new UserDetails(coach4.Id, "Anna", "Lewandowska");
            coachDetails4.UpdateProfile("Anna", "Lewandowska", "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna&backgroundColor=8b5cf6", "Karate champion specializing in dynamic movement and cardio stamina.");
            
            context.Users.AddRange(coach1, coach2, coach3, coach4);
            context.UserDetails.AddRange(coachDetails1, coachDetails2, coachDetails3, coachDetails4);

            // Members
            var firstNames = new[] { "Anna", "Piotr", "Jan", "Maria", "Tomasz", "Katarzyna", "Michal", "Agnieszka", "Krzysztof", "Magdalena" };
            var lastNames = new[] { "Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kowalczyk", "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Wozniak" };
            var testMembers = new List<User>(); 
            
            for (int i = 0; i < 10; i++)
            {
                var member = new User($"member{i + 1}@gmail.com", passwordHasher.Hash("Member123!"), UserRole.Member);
                var memberDetails = new UserDetails(member.Id, firstNames[i], lastNames[i]);
                
                // Set some initial random metrics for visual purposes on profiles
                memberDetails.UpdateMetrics(60m + (i * 3.5m), 160m + (i * 2.5m)); 
                
                context.Users.Add(member);
                context.UserDetails.Add(memberDetails);
                testMembers.Add(member);
            }
            await context.SaveChangesAsync();
            
            // Subscriptions
            var today = DateTime.UtcNow.Date;
            for (int i = 0; i < 8; i++)
            {
                var tierId = (i % 3 == 0) ? vipTier.Id : (i % 2 == 0 ? proTier.Id : basicTier.Id);
                context.UserSubscriptions.Add(new UserSubscription(testMembers[i].Id, tierId, today.AddDays(-20), today.AddDays(15)));
            }
            
            // Group Classes (past and future)
            var tomorrow = today.AddDays(1);
            var dayAfter = today.AddDays(2);
            
            // Past classes to populate "Activity History"
            var pastClass1 = new GroupClass("Evening Crossfit", coach1.Id, crossfitBox.Id, today.AddDays(-2).AddHours(18), today.AddDays(-2).AddHours(19), 15, crossfitBox.ImageUrl);
            var pastClass2 = new GroupClass("Morning Stretching", coach4.Id, yogaStudio.Id, today.AddDays(-1).AddHours(8), today.AddDays(-1).AddHours(9), 20, yogaStudio.ImageUrl);
            var pastClass3 = new GroupClass("Heavy Lifters", coach3.Id, mainGym.Id, today.AddDays(-1).AddHours(19), today.AddDays(-1).AddHours(20.5), 10, mainGym.ImageUrl);
            
            // Future upcoming classes
            var class1 = new GroupClass("Hardcore Bodybuilding", coach3.Id, mainGym.Id, tomorrow.AddHours(10), tomorrow.AddHours(11), 15, mainGym.ImageUrl);
            var class2 = new GroupClass("Pilates for Beginners", coach2.Id, yogaStudio.Id, tomorrow.AddHours(11), tomorrow.AddHours(12), 20, yogaStudio.ImageUrl);
            var class3 = new GroupClass("Fat Burn Cardio", coach4.Id, cardioZone.Id, tomorrow.AddHours(18), tomorrow.AddHours(19), 25, cardioZone.ImageUrl);
            var class4 = new GroupClass("Strongman Training", coach1.Id, functionalZone.Id, dayAfter.AddHours(17), dayAfter.AddHours(18.5), 15, functionalZone.ImageUrl);
            var class5 = new GroupClass("Advanced Crossfit", coach1.Id, crossfitBox.Id, dayAfter.AddHours(19), dayAfter.AddHours(20), 12, crossfitBox.ImageUrl);
            var class6 = new GroupClass("Relaxing Yoga", coach2.Id, yogaStudio.Id, dayAfter.AddHours(20), dayAfter.AddHours(21), 20, yogaStudio.ImageUrl);

            context.GroupClasses.AddRange(pastClass1, pastClass2, pastClass3, class1, class2, class3, class4, class5, class6);
            await context.SaveChangesAsync();
            
            // Trainer Slots (past and future)
            var pastSlot1 = new TrainerSlot(coach1.Id, today.AddDays(-2).AddHours(12), today.AddDays(-2).AddHours(13));
            var pastSlot2 = new TrainerSlot(coach2.Id, today.AddDays(-1).AddHours(15), today.AddDays(-1).AddHours(16));
            
            var futureSlot1 = new TrainerSlot(coach1.Id, tomorrow.AddHours(14), tomorrow.AddHours(15));
            var futureSlot2 = new TrainerSlot(coach2.Id, dayAfter.AddHours(9), dayAfter.AddHours(10));
            var futureSlot3 = new TrainerSlot(coach4.Id, tomorrow.AddHours(12), tomorrow.AddHours(13));
            var futureSlot4 = new TrainerSlot(coach1.Id, dayAfter.AddHours(12), dayAfter.AddHours(13));
            var futureSlot5 = new TrainerSlot(coach3.Id, tomorrow.AddHours(16), tomorrow.AddHours(17));
            
            // Simulate bookings on slots
            pastSlot1.Book(testMembers[0].Id);   // Member 1 history
            pastSlot2.Book(testMembers[3].Id);   // Member 4 history
            futureSlot1.Book(testMembers[0].Id); // Member 1 upcoming
            futureSlot5.Book(testMembers[1].Id); // Member 2 upcoming
            
            context.TrainerSlots.AddRange(pastSlot1, pastSlot2, futureSlot1, futureSlot2, futureSlot3, futureSlot4, futureSlot5);
            
            var reservations = new List<ClassReservation>();
            
            // History for Member 1 (member1@gmail.com)
            reservations.Add(new ClassReservation(userId: testMembers[0].Id, groupClassId: pastClass1.Id));
            reservations.Add(new ClassReservation(userId: testMembers[0].Id, groupClassId: pastClass3.Id));
            
            // Upcoming for Member 1
            reservations.Add(new ClassReservation(userId: testMembers[0].Id, groupClassId: class1.Id));
            reservations.Add(new ClassReservation(userId: testMembers[0].Id, groupClassId: class3.Id));
            
            // Random traffic from other members to make classes look busy
            reservations.Add(new ClassReservation(userId: testMembers[1].Id, groupClassId: class1.Id));
            reservations.Add(new ClassReservation(userId: testMembers[2].Id, groupClassId: class1.Id)); // Hardcore Bodybuilding has 3 people
            
            for(int i = 2; i < 8; i++) reservations.Add(new ClassReservation(userId: testMembers[i].Id, groupClassId: class2.Id)); // Pilates has 6 people
            for(int i = 4; i < 9; i++) reservations.Add(new ClassReservation(userId: testMembers[i].Id, groupClassId: class4.Id)); // Strongman has 5 people
            
            context.ClassReservations.AddRange(reservations);
            await context.SaveChangesAsync();
        }
    }
}