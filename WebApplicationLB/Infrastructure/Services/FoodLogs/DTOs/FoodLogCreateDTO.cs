using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.FoodLogs
{
    public class FoodLogCreateDTO
    {
        [Required, StringLength(100)]
        public string FoodName { get; set; } = string.Empty;

        [Range(0, 10000)]
        public int Calories { get; set; }

        [Range(0, 1000)]
        public double Protein { get; set; }

        [Range(0, 1000)]
        public double Carbohydrates { get; set; }

        [Range(0, 1000)]
        public double Fat { get; set; }

        // Optional: if not sent, the current time is used
        public DateTime? ConsumedAt { get; set; }
    }
}
