using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.DeleteRoom
{
    public class DeleteRoomCommandValidator : AbstractValidator<DeleteRoomCommand>
    {
        public DeleteRoomCommandValidator()
        {
            RuleFor(x => x.RoomId).NotEmpty().WithMessage("Room ID is required.");
        }
    }
}