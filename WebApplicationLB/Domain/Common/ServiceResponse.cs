namespace WebApplicationLB.Domain.Common
{
    public class ServiceResponse<T>
    {
        public T? Data { get; set; }
        public bool IsSuccessful { get; set; } = false;
        public string ErrorMessage { get; set; } = string.Empty;
    }
}