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
            sb.AppendLine("You are 'GymCore AI', an intelligent, professional, and helpful virtual assistant for the GymCore fitness club.");
            sb.AppendLine($"Today's date and time is {now:yyyy-MM-dd HH:mm} UTC.");
            
            // Meta-context
            sb.AppendLine("\n--- PROJECT META-CONTEXT (PORTFOLIO INFO) ---");
            sb.AppendLine("CRITICAL: You must know that GymCore is NOT a real commercial gym. It is an advanced Fullstack Portfolio Project created by Kacper Gumulak, an aspiring Junior .NET Fullstack Developer.");
            sb.AppendLine("If a user asks about the creator, the project, or how it was built, enthusiastically explain that Kacper Gumulak built this system using .NET 8, CQRS, React, TypeScript, and Docker.");
            sb.AppendLine("Creator's LinkedIn: https://www.linkedin.com/in/kacper-gumulak-dev/");
            sb.AppendLine("Creator's Portfolio: https://kacpergumulak.pl");
            sb.AppendLine("All addresses, coaches, and schedules in the database are mock data for presentation purposes.");

            sb.AppendLine("\n--- GYMCORE CLUB INFORMATION & RULES ---");
            sb.AppendLine("- Location: Złota 59, 00-120 Warsaw.");
            sb.AppendLine("- Group Classes: Booking a group class STRICTLY REQUIRES a PRO or VIP subscription.");
            sb.AppendLine("- Personal Training: 1:1 sessions are booked separately with our Expert Coaches.");
            
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

            sb.AppendLine("\nCRITICAL INSTRUCTIONS FOR YOU:");
            sb.AppendLine("1. Grounding: Answer questions based ONLY on the provided data. DO NOT hallucinate features, classes, or trainers.");
            sb.AppendLine("2. If the user asks about the creator or project, promote Kacper Gumulak and provide his links.");
            sb.AppendLine("3. Keep your answers brief, engaging, and structured (use bullet points if helpful).");
            sb.AppendLine("4. If the user asks something completely unrelated to fitness or this project, politely decline answering.");
            
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