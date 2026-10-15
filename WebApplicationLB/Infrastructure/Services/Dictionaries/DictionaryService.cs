using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.Dictionaries;
using WebApplicationLB.Infrastructure.Services.Dictionaries.DTOs;

namespace WebApplicationLB.Infrastructure.Services
{
    public class DictionaryService
    {
        private readonly ApplicationDbContext _context;

        public DictionaryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<DictionaryResponseDTO>> CreateDictionary(CreateDictionaryDTO Cdto)
        {
            var result = new ServiceResponse<DictionaryResponseDTO>();

            var exists = await _context.Dictionaries.AnyAsync(d =>
                d.DictionaryGroupIntCode == Cdto.DictionaryGroupIntCode &&
                d.DictionaryCaption == Cdto.DictionaryCaption);

            if (exists)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(DictionaryService)}.{nameof(CreateDictionary)} - ERROR: '{Cdto.DictionaryCaption}' already exists in group {Cdto.DictionaryGroupIntCode}.";
                return result;
            }

          
            if (Cdto.DictionaryParentID.HasValue)
            {
                var parentExists = await _context.Dictionaries
                    .AnyAsync(d => d.DictionaryID == Cdto.DictionaryParentID.Value);

                if (!parentExists)
                {
                    result.IsSuccessful = false;
                    result.ErrorMessage = $"{nameof(DictionaryService)}.{nameof(CreateDictionary)} - ERROR: Parent with ID {Cdto.DictionaryParentID} not found.";
                    return result;
                }
            }

            var newDictionary = new Dictionary
            {
                DictionaryGroupIntCode = Cdto.DictionaryGroupIntCode,
                DictionaryCaption = Cdto.DictionaryCaption,
                DictionaryItemIntCode = Cdto.DictionaryItemIntCode,
                DictionaryParentID = Cdto.DictionaryParentID
            };

            await _context.Dictionaries.AddAsync(newDictionary);
            await _context.SaveChangesAsync();

            result.IsSuccessful = true;
            result.Data = new DictionaryResponseDTO
            {
                DictionaryID = newDictionary.DictionaryID,
                DictionaryGroupIntCode = newDictionary.DictionaryGroupIntCode,
                DictionaryCaption = newDictionary.DictionaryCaption,
                DictionaryItemIntCode = newDictionary.DictionaryItemIntCode,
                DictionaryParentID = newDictionary.DictionaryParentID
            };

            return result;
        }

        public async Task<List<DictionaryResponseDTO>?> GetByGroup(int groupCode)
        {
            var items = await _context.Dictionaries
                .Where(d => d.DictionaryGroupIntCode == groupCode)
                .OrderBy(d => d.DictionaryItemIntCode)
                .Select(d => new DictionaryResponseDTO
                {
                    DictionaryID = d.DictionaryID,
                    DictionaryCaption = d.DictionaryCaption,
                    DictionaryItemIntCode = d.DictionaryItemIntCode
                })
                .ToListAsync();

            if (items == null || items.Count == 0)
            {
                return null;
            }

            return items;
        }
    }
}