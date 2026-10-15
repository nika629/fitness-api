namespace WebApplicationLB.Infrastructure.Services.Dictionaries
{
    public class DictionaryResponseDTO
    {
        public int DictionaryID { get; set; }
        public int? DictionaryGroupIntCode { get; set; }
        public string DictionaryCaption { get; set; } = string.Empty;
        public int? DictionaryItemIntCode { get; set; }
        public int? DictionaryParentID { get; set; }
    }
}