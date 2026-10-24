using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.Dictionaries.DTOs
{
    public class CreateDictionaryDTO
    {
        [Range(1, int.MaxValue)]
        public int DictionaryGroupIntCode { get; set; }

        [Required, StringLength(100)]
        public string DictionaryCaption { get; set; } = string.Empty;

        public int? DictionaryItemIntCode { get; set; }

        public int? DictionaryParentID { get; set; }
    }
}
