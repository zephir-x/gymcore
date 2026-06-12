using FluentValidation.Results;

namespace GymCore.Application.Common.Exceptions
{
    // Custom exception to hold nicely formatted validation errors
    public class ValidationException() : Exception("One or more validation failures have occurred.")
    {
        private IDictionary<string, string[]> Errors { get; } = new Dictionary<string, string[]>();

        public ValidationException(IEnumerable<ValidationFailure> failures) : this()
        {
            // Group errors by property name (e.g., "Email" -> ["Is required", "Invalid format"])
            foreach (var failure in failures)
            {
                var propertyName = failure.PropertyName;
                var errorMessage = failure.ErrorMessage;

                if (!Errors.ContainsKey(propertyName))
                {
                    Errors[propertyName] = [errorMessage];
                }
                else
                {
                    var existing = Errors[propertyName];
                    var updated = new string[existing.Length + 1];
                    existing.CopyTo(updated, 0);
                    updated[^1] = errorMessage;
                    Errors[propertyName] = updated;
                }
            }
        }
    }
}