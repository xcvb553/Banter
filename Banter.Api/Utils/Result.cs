namespace Banter.Utils
{
    public enum ErrorType
    {
        None,
        BadRequest,
        NotFound,
        Forbidden
    }

    public class Result
    {
        public bool IsSuccess { get; }
        public string? Message { get; }
        public ErrorType Error { get; }

        protected Result(bool isSuccess, string? message, ErrorType error)
        {
            IsSuccess = isSuccess;
            Message = message;
            Error = error;
        }

        public static Result Success() => new(true, null, ErrorType.None);
        public static Result Failure(string message) => new(false, message, ErrorType.BadRequest);
        public static Result NotFound(string message) => new(false, message, ErrorType.NotFound);
        public static Result Forbidden(string message) => new(false, message, ErrorType.Forbidden);
    }

    public class Result<T> : Result
    {
        public T? Data { get; }

        private Result(bool isSuccess, T? data, string? message, ErrorType error) : base(isSuccess, message, error)
        {
            Data = data;
        }

        public static Result<T> Success(T data) => new(true, data, null, ErrorType.None);
        public static new Result<T> Failure(string message) => new(false, default, message, ErrorType.BadRequest);
        public static new Result<T> NotFound(string message) => new(false, default, message, ErrorType.NotFound);
        public static new Result<T> Forbidden(string message) => new(false, default, message, ErrorType.Forbidden);
    }
}
