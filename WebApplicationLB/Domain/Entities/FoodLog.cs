namespace WebApplicationLB.Domain.Entities
{
    internal record FoodLog
    {
        public int FoodLogID { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public int Calories { get; set; } = 0;
        public double Protein { get; set; } = 0;
        public double Carbohydrates { get; set; } = 0;
        public double Fat { get; set; } = 0;
        public DateTime ConsumedAt { get; set; }

        public int UserID { get; set; }
        public User? User { get; set; }
    }
}