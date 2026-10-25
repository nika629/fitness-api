namespace WebApplicationLB.Infrastructure.Services.WeightLogs
{
    public class WeightLogResponseDTO
    {
        public int WeightLogID { get; set; }
        public int UserID { get; set; }
        public double Weight { get; set; }
        public DateTime LoggedAt { get; set; }
    }
}
