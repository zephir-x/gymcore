using System;
using System.Collections.Generic;
using FluentValidation.Results;

namespace GymCore.Application.Common.Exceptions
{
    // Custom exception to hold nicely formatted validation errors
    public class ValidationException : Exception
    {
        public IDictionary<string, string[]> Errors { get; }

        public ValidationException() : base("One or more validation failures have occurred.")
        {
            Errors = new Dictionary<string, string[]>();
        }

        public ValidationException(IEnumerable<ValidationFailure> failures) : this()
        {
            // Group errors by property name (e.g., "Email" -> ["Is required", "Invalid format"])
            foreach (var failure in failures)
            {
                var propertyName = failure.PropertyName;
                var errorMessage = failure.ErrorMessage;

                if (!Errors.ContainsKey(propertyName))
                {
                    Errors[propertyName] = new[] { errorMessage };
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