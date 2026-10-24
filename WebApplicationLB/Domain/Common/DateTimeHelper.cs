namespace WebApplicationLB.Domain.Common
{
    public static class DateTimeHelper
    {
        // PostgreSQL "timestamp with time zone" columns only accept UTC DateTime values.
        public static DateTime ToUtc(DateTime value) => value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

        public static DateTime? ToUtc(DateTime? value) => value.HasValue ? ToUtc(value.Value) : null;
    }
}
