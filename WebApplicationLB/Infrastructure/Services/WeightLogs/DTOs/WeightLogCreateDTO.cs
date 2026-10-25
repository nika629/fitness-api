using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.WeightLogs
{
    public class WeightLogCreateDTO
    {
        [Range(20, 400)]
        public double Weight { get; set; }

        // Optional: if not sent, the current time is used
        public DateTime? LoggedAt { get; set; }
    }
}
