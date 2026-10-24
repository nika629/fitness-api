using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Constants;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.Roles;

namespace WebApplicationLB.Infrastructure.Services
{
    public class RoleService
    {
        private readonly ApplicationDbContext _context;

        public RoleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<List<RoleResoponseDTO>>> GetRoles()
        {
            var roles = await _context.Dictionaries
                .Where(d => d.DictionaryGroupIntCode == DictionaryGroups.Roles)
                .OrderBy(d => d.DictionaryID)
                .Select(d => new RoleResoponseDTO
                {
                    RoleID = d.DictionaryID,
                    RoleName = d.DictionaryCaption
                })
                .ToListAsync();

            return ServiceResponse<List<RoleResoponseDTO>>.Success(roles);
        }
    }
}
