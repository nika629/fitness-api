using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Domain.Constants;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Dictionaries;
using WebApplicationLB.Infrastructure.Services.Dictionaries.DTOs;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DictionaryController : BaseApiController
    {
        private readonly DictionaryService _dictionaryService;

        public DictionaryController(DictionaryService dictionaryService)
        {
            _dictionaryService = dictionaryService;
        }

        // 1 = Roles, 2 = Equipment, 3 = Muscle groups. Any logged-in user can read (needed for dropdowns).
        [HttpGet("group/{groupCode}")]
        public async Task<ActionResult<List<DictionaryResponseDTO>>> GetByGroup(int groupCode)
        {
            return FromResult(await _dictionaryService.GetByGroup(groupCode));
        }

        [HttpPost]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<ActionResult<DictionaryResponseDTO>> CreateDictionary(CreateDictionaryDTO dto)
        {
            return FromResult(await _dictionaryService.CreateDictionary(dto));
        }
    }
}
