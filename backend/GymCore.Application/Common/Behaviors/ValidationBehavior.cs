using FluentValidation;
using MediatR;
using ValidationException = GymCore.Application.Common.Exceptions.ValidationException;

namespace GymCore.Application.Common.Behaviors
{
    // This intercepts every request before it hits the handler
    public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
        : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
    {
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            if (!validators.Any()) return await next(cancellationToken);
            var context = new ValidationContext<TRequest>(request);

            // Run all validators asynchronously
            var validationResults = await Task.WhenAll(
                validators.Select(v => v.ValidateAsync(context, cancellationToken)));

            var failures = validationResults
                .SelectMany(r => r.Errors)
                .Where(f => f != null)
                .ToList();

            // If any errors exist, short-circuit the request and throw our custom exception
            if (failures.Count != 0)
            {
                throw new ValidationException(failures);
            }

            // If validation passes, move to the actual handler
            return await next(cancellationToken);
        }
    }
}