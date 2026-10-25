namespace WebApplicationLB.Domain.Entities
{
    
    internal record WeightLog
    {
        public int WeightLogID { get; set; }

        public int UserID { get; set; }
        public User? User { get; set; }

        public double Weight { get; set; }
        public DateTime LoggedAt { get; set; }
    }
}
