namespace WebApplicationLB.Domain.Common
{
    public class ServiceResponse<T>
    {
        public T? Data { get; set; }
        public bool IsSuccessful { get; set; } = false;
        public string ErrorMessage { get; set; } = string.Empty;

        // HTTP status code the controller should return (200, 400, 401, 404, 409 ...)
        public int StatusCode { get; set; } = 200;

        public static ServiceResponse<T> Success(T data) =>
            new() { Data = data, IsSuccessful = true, StatusCode = 200 };

        public static ServiceResponse<T> Fail(string message, int statusCode = 400) =>
            new() { IsSuccessful = false, ErrorMessage = message, StatusCode = statusCode };

        public static ServiceResponse<T> NotFound(string message) => Fail(message, 404);

        public static ServiceResponse<T> Conflict(string message) => Fail(message, 409);
    }
}
