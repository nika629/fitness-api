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

        public async Task<ServiceResponse<DictionaryResponseDTO>> CreateDictionary(CreateDictionaryDTO dto)
        {
            var caption = dto.DictionaryCaption.Trim();

            var exists = await _context.Dictionaries.AnyAsync(d =>
                d.DictionaryGroupIntCode == dto.DictionaryGroupIntCode &&
                d.DictionaryCaption == caption);
            if (exists)
            {
                return ServiceResponse<DictionaryResponseDTO>.Conflict($"'{caption}' already exists in group {dto.DictionaryGroupIntCode}.");
            }

            if (dto.DictionaryParentID.HasValue)
            {
                var parentExists = await _context.Dictionaries.AnyAsync(d => d.DictionaryID == dto.DictionaryParentID.Value);
                if (!parentExists)
                {
                    return ServiceResponse<DictionaryResponseDTO>.Fail($"Parent with ID {dto.DictionaryParentID} not found.");
                }
            }

            var newDictionary = new Dictionary
            {
                DictionaryGroupIntCode = dto.DictionaryGroupIntCode,
                DictionaryCaption = caption,
                DictionaryItemIntCode = dto.DictionaryItemIntCode,
                DictionaryParentID = dto.DictionaryParentID
            };

            await _context.Dictionaries.AddAsync(newDictionary);
            await _context.SaveChangesAsync();

            return ServiceResponse<DictionaryResponseDTO>.Success(new DictionaryResponseDTO
            {
                DictionaryID = newDictionary.DictionaryID,
                DictionaryGroupIntCode = newDictionary.DictionaryGroupIntCode,
                DictionaryCaption = newDictionary.DictionaryCaption,
                DictionaryItemIntCode = newDictionary.DictionaryItemIntCode,
                DictionaryParentID = newDictionary.DictionaryParentID
            });
        }

        // Empty list (not an error) when the group has no items
        public async Task<ServiceResponse<List<DictionaryResponseDTO>>> GetByGroup(int groupCode)
        {
            var items = await _context.Dictionaries
                .Where(d => d.DictionaryGroupIntCode == groupCode)
                .OrderBy(d => d.DictionaryItemIntCode)
                .Select(d => new DictionaryResponseDTO
                {
                    DictionaryID = d.DictionaryID,
                    DictionaryGroupIntCode = d.DictionaryGroupIntCode,
                    DictionaryCaption = d.DictionaryCaption,
                    DictionaryItemIntCode = d.DictionaryItemIntCode,
                    DictionaryParentID = d.DictionaryParentID
                })
                .ToListAsync();

            return ServiceResponse<List<DictionaryResponseDTO>>.Success(items);
        }
    }
}
