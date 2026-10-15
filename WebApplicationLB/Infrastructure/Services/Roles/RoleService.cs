using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
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
            var result = new ServiceResponse<List<RoleResoponseDTO>>();

            var roles = await _context.Dictionaries.Select(item => new RoleResoponseDTO
            {
                RoleID = item.DictionaryID,
                RoleName = item.DictionaryCaption,
            }).ToListAsync();

            if (roles == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(RoleService)}.{nameof(GetRoles)} - ERROR: Couldn't get roles.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = roles;
            }

            return result;
        }
    }
}
