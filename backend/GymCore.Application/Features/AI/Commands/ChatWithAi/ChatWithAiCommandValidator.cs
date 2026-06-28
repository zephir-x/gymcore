using FluentValidation;

namespace GymCore.Application.Features.AI.Commands.ChatWithAi
{
    public class ChatWithAiCommandValidator : AbstractValidator<ChatWithAiCommand>
    {
        public ChatWithAiCommandValidator()
        {
            RuleFor(x => x.Messages)
                .NotEmpty().WithMessage("Chat messages cannot be empty.")
                .Must(m => m.Count <= 20).WithMessage("Conversation history is too long. Please refresh the page to start a new chat.");

            RuleForEach(x => x.Messages).ChildRules(message =>
            {
                message.RuleFor(m => m.Role)
                    .NotEmpty().WithMessage("Role is required.")
                    .Must(role => role.ToLower() == "user" || role.ToLower() == "assistant" || role.ToLower() == "system")
                    .WithMessage("Invalid message role.");

                message.RuleFor(m => m.Content)
                    .NotEmpty().WithMessage("Message content is required.")
                    .MaximumLength(1000).WithMessage("Individual message exceeds the length limit.");
            });
        }
    }
}