using FluentValidation;

namespace GymCore.Application.Features.Bookings.Commands.BookTrainerSlot
{
    public class BookTrainerSlotCommandValidator : AbstractValidator<BookTrainerSlotCommand>
    {
        public BookTrainerSlotCommandValidator()
        {
            RuleFor(x => x.SlotId).NotEmpty().WithMessage("Slot ID is required.");
            RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        }
    }
}