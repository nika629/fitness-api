namespace WebApplicationLB.Infrastructure.Services.Dictionaries.DTOs
{
    public class CreateDictionaryDTO
    {
        public int DictionaryGroupIntCode { get; set; }
        public string DictionaryCaption { get; set; } = string.Empty;
        public int? DictionaryItemIntCode { get; set; }
        public int? DictionaryParentID { get; set; }
    }
}
