using FluentValidation;

namespace GymCore.Application.Features.Admin.Commands.UpdateRoom
{
    public class UpdateRoomCommandValidator : AbstractValidator<UpdateRoomCommand>
    {
        public UpdateRoomCommandValidator()
        {
            RuleFor(x => x.RoomId).NotEmpty().WithMessage("Room ID is required.");
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100).WithMessage("Room name is required and cannot exceed 100 characters.");
            RuleFor(x => x.MaxCapacity).GreaterThan(0).WithMessage("Room must accommodate at least 1 person.");
        }
    }
}