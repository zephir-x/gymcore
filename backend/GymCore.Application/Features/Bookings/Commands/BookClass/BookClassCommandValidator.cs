using FluentValidation;

namespace GymCore.Application.Features.Bookings.Commands.BookClass
{
    public class BookClassCommandValidator : AbstractValidator<BookClassCommand>
    {
        public BookClassCommandValidator()
        {
            RuleFor(x => x.ClassId).NotEmpty().WithMessage("Class ID is required.");
            RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        }
    }
}