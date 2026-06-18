using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.DeleteGroupClass
{
    public class DeleteGroupClassCommandValidator : AbstractValidator<DeleteGroupClassCommand>
    {
        public DeleteGroupClassCommandValidator()
        {
            RuleFor(x => x.ClassId).NotEmpty();
        }
    }
}