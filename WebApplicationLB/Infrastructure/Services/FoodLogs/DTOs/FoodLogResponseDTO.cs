namespace WebApplicationLB.Infrastructure.Services.FoodLogs
{
    public class FoodLogResponseDTO
    {
        public int FoodLogID { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public int Calories { get; set; }
        public double Protein { get; set; }
        public double Carbohydrates { get; set; }
        public double Fat { get; set; }
        public DateTime ConsumedAt { get; set; }

        public int UserID { get; set; }
       
    }
}
