namespace WebApplicationLB.Infrastructure.Services.Token
{
    public class UserDTO
    {
        #region Properties
        public int UserID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        #endregion
    }
}