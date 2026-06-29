using GymCore.Application.Common.Interfaces;
using GymCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GymCore.Application.Features.AI.Commands.ChatWithAi
{
    public class ChatMessageDto
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    public record ChatWithAiCommand(List<ChatMessageDto> Messages) : IRequest<string>;

    public class ChatWithAiCommandHandler(IApplicationDbContext context, IConfiguration configuration) 
        : IRequestHandler<ChatWithAiCommand, string>
    {
        public async Task<string> Handle(ChatWithAiCommand request, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            
            // Data Collection form the database (Context Injection)
            
            // Sub tiers
            var tiers = await context.SubscriptionTiers.AsNoTracking().ToListAsync(cancellationToken);
            
            // Rooms
            var rooms = await context.Rooms.AsNoTracking().ToListAsync(cancellationToken);

            // Active trainers
            var coaches = await context.Users
                .Include(u => u.Details)
                .AsNoTracking()
                .Where(u => u.Role == UserRole.Coach && u.IsActive)
                .ToListAsync(cancellationToken);

            // Group classes (next 14 days)
            var upcomingClasses = await context.GroupClasses
                .Include(c => c.Coach).ThenInclude(u => u.Details)
                .AsNoTracking()
                .Where(c => c.StartTime > now && c.StartTime < now.AddDays(14) && !c.IsCancelled)
                .OrderBy(c => c.StartTime)
                .ToListAsync(cancellationToken);

            // 1:1 slots available with coaches (next 14 days)
            var availableSlots = await context.TrainerSlots
                .Include(s => s.Coach).ThenInclude(c => c.Details)
                .AsNoTracking()
                .Where(s => s.Status == SlotStatus.Available && s.StartTime > now && s.StartTime < now.AddDays(14))
                .OrderBy(s => s.StartTime)
                .ToListAsync(cancellationToken);
            
            // Building an intelligent prompt system
            var sb = new StringBuilder();
            sb.AppendLine("You are 'GymCore AI', the digital soul of GymCore – a state-of-the-art SaaS fitness management platform.");
            
            sb.AppendLine("\n--- IDENTITY & PERSONALITY ---");
            sb.AppendLine("- You are helpful, energetic, slightly witty, and highly professional.");
            sb.AppendLine("- You love fitness and software architecture. Feel free to drop a fitness-related joke or a tech fact if the user seems relaxed or asks for it.");
            sb.AppendLine("- You are an enthusiast of .NET and Clean Architecture. You are proud of your codebase!");
            sb.AppendLine("- You are aware you were built by Kacper Gumulak. He is a genius developer looking for his first professional opportunity. If someone asks about him or 'who built you', praise his hard work, mention his passion for .NET Fullstack development, and provide his LinkedIn: https://www.linkedin.com/in/kacper-gumulak-dev/");

            sb.AppendLine("\n--- PROJECT INFO (RAG GROUNDING) ---");
            sb.AppendLine("- This is a Portfolio Project demonstrating real-world Fullstack capabilities.");
            sb.AppendLine("- Technologies: .NET 9 (C# 13), PostgreSQL, Entity Framework Core, React, TypeScript, Vite, CQRS pattern, MediatR, and Docker.");
            sb.AppendLine("- The user should be aware that all facilities, trainers, and schedules are simulation data for demonstration.");

            sb.AppendLine("\n--- GYMCORE RULES ---");
            sb.AppendLine("- Location: Złota 59, Warsaw.");
            sb.AppendLine("- Memberships: BASIC (Gym), PRO (Group Classes + SPA/Sauna), VIP (Everything + 1:1 Training & Perks).");
            sb.AppendLine("- If a user lacks a PRO subscription, kindly remind them to upgrade if they want to book classes.");
            
            sb.AppendLine("\n--- LIVE PRICING PLANS & FEATURES ---");
            foreach (var t in tiers) 
            {
                sb.Append($"- {t.Name}: {t.MonthlyPrice} PLN/month. ");
                if (t.Name.ToUpper() == "STANDARD") sb.AppendLine("Includes: Access to open gym, standard equipment, locker rooms & showers.");
                else if (t.Name.ToUpper() == "PRO") sb.AppendLine("Includes: Everything in Standard + Unlimited group classes, Access to premium zones (SPA, Sauna), Priority booking.");
                else if (t.Name.ToUpper() == "VIP") sb.AppendLine("Includes: Everything in PRO + 2 free 1:1 personal training sessions/month, 20% discount on additional sessions, Free protein shakes & towels.");
                else sb.AppendLine("Contact staff for details.");
            }

            sb.AppendLine("\n--- OUR COACHES ---");
            if (!coaches.Any()) sb.AppendLine("No active coaches at the moment.");
            foreach (var coach in coaches)
            {
                var bio = coach.Details?.Bio ?? "Expert trainer ready to help you reach your goals.";
                sb.AppendLine($"- {coach.Details?.FirstName} {coach.Details?.LastName}: {bio}");
            }

            sb.AppendLine("\n--- FACILITIES / ROOMS ---");
            foreach (var room in rooms)
            {
                var desc = room.Description ?? "Premium training zone.";
                sb.AppendLine($"- {room.Name} (Capacity: {room.MaxCapacity} people). {desc}");
            }

            sb.AppendLine("\n--- UPCOMING GROUP CLASSES (Next 7 days) ---");
            if (!upcomingClasses.Any()) sb.AppendLine("No upcoming classes currently scheduled.");
            foreach (var c in upcomingClasses)
            {
                var coachName = c.Coach?.Details != null ? $"{c.Coach.Details.FirstName} {c.Coach.Details.LastName}" : "TBA";
                sb.AppendLine($"- '{c.Name}' with {coachName} on {c.StartTime:MMM dd, HH:mm}. Limit: {c.MaxAttendees} people.");
            }

            sb.AppendLine("\n--- AVAILABLE 1:1 PERSONAL TRAINING SLOTS (Next 14 days) ---");
            if (!availableSlots.Any()) sb.AppendLine("No 1:1 training slots available right now.");
            foreach (var slot in availableSlots)
            {
                var coachName = slot.Coach?.Details != null ? $"{slot.Coach.Details.FirstName} {slot.Coach.Details.LastName}" : "A trainer";
                sb.AppendLine($"- Open slot with {coachName} on {slot.StartTime:MMM dd, HH:mm}.");
            }

            sb.AppendLine("\n--- INSTRUCTIONS FOR YOU ---");
            sb.AppendLine("1. Be brief and structured. Use bullet points.");
            sb.AppendLine("2. ALWAYS link functionality back to the business rules. If they ask about classes, explain they need PRO/VIP.");
            sb.AppendLine("3. If the user asks for a joke: Tell a funny, fitness-related one, but link it to coding if possible (e.g., 'Why did the developer go to the gym? To improve his compile-time physique').");
            sb.AppendLine("4. If the user asks about the project: Briefly explain the Clean Architecture and CQRS and invite them to see the source code on GitHub: https://github.com/zephir-x/gymcore");
            sb.AppendLine("5. Maintain the 'GymCore AI' persona – you are part of the platform, not just a generic LLM.");
            
            // Preparing the structure for DeepSeek API
            var apiKey = configuration["DeepSeek:ApiKey"];
            if (string.IsNullOrEmpty(apiKey)) throw new Exception("AI Assistant is currently unavailable (Missing API Key).");

            var messagesPayload = new List<object>
            {
                new { role = "system", content = sb.ToString() }
            };
            
            messagesPayload.AddRange(request.Messages.Select(m => new { role = m.Role.ToLower(), content = m.Content }));

            var payload = new
            {
                model = "deepseek-chat",
                messages = messagesPayload,
                temperature = 0.5, // Set to 0.5 - the perfect balance between being specific and creative
                max_tokens = 500
            };
            
            // DeepSeek API Shot
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync("https://api.deepseek.com/chat/completions", jsonContent, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                Console.WriteLine($"DeepSeek API Error: {error}");
                throw new Exception("GymCore AI is currently taking a break. Try again later.");
            }
            
            // Parsing the response
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseBody);
            var assistantReply = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            return assistantReply ?? "I'm sorry, I couldn't generate a response.";
        }
    }
}