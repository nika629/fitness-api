using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.WeightLogs;

namespace WebApplicationLB.Infrastructure.Services
{
    // Body weight history for the progress chart
    public class WeightLogService
    {
        private readonly ApplicationDbContext _context;

        public WeightLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Oldest first, so a chart can draw it left to right
        public async Task<ServiceResponse<List<WeightLogResponseDTO>>> GetWeightLogs(int userID)
        {
            var logs = await _context.WeightLogs
                .Where(w => w.UserID == userID)
                .OrderBy(w => w.LoggedAt)
                .Select(w => new WeightLogResponseDTO
                {
                    WeightLogID = w.WeightLogID,
                    UserID = w.UserID,
                    Weight = w.Weight,
                    LoggedAt = w.LoggedAt
                })
                .ToListAsync();

            return ServiceResponse<List<WeightLogResponseDTO>>.Success(logs);
        }

        public async Task<ServiceResponse<WeightLogResponseDTO>> CreateWeightLog(int userID, WeightLogCreateDTO dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userID);
            if (user == null)
            {
                return ServiceResponse<WeightLogResponseDTO>.NotFound("User not found.");
            }

            var loggedAt = dto.LoggedAt.HasValue ? DateTimeHelper.ToUtc(dto.LoggedAt.Value) : DateTime.UtcNow;

            var log = new WeightLog
            {
                UserID = userID,
                Weight = dto.Weight,
                LoggedAt = loggedAt
            };
            _context.WeightLogs.Add(log);

            // Keep User.CurrentWeight in sync, unless an older date was entered
            var hasNewerLog = await _context.WeightLogs.AnyAsync(w => w.UserID == userID && w.LoggedAt > loggedAt);
            if (!hasNewerLog)
            {
                user.CurrentWeight = dto.Weight;
                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ServiceResponse<WeightLogResponseDTO>.Success(new WeightLogResponseDTO
            {
                WeightLogID = log.WeightLogID,
                UserID = log.UserID,
                Weight = log.Weight,
                LoggedAt = log.LoggedAt
            });
        }
    }
}
