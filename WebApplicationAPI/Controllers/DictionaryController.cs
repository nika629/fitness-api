using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Dictionaries;
using WebApplicationLB.Infrastructure.Services.Dictionaries.DTOs;

namespace WebApplicationAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DictionaryController : ControllerBase
    {
        private readonly DictionaryService _dictionaryService;

        public DictionaryController(DictionaryService dictionaryService)
        {
            _dictionaryService = dictionaryService;
        }

        [HttpGet("group/{groupCode}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<DictionaryResponseDTO>>> GetByGroup(int groupCode)
        {
            var items = await _dictionaryService.GetByGroup(groupCode);

            if (items == null)
            {
                return NotFound($"No dictionary items found for group code {groupCode}.");
            }

            return Ok(items);
        }

        [HttpPost("group/{groupCode}")]
        public async Task<ActionResult<List<DictionaryResponseDTO>>> CreateDictionary(CreateDictionaryDTO Cdto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _dictionaryService.CreateDictionary(Cdto);

            if (!result.IsSuccessful)
            {
                return BadRequest(result.ErrorMessage);
            }

            return Ok(result.Data);
        }
    }
}