using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.FoodLogs;

namespace WebApplicationLB.Infrastructure.Services
{
    public class FoodLogService
    {
        private readonly ApplicationDbContext _context;

        public FoodLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        // date (optional) = only the logs of that day (UTC)
        public async Task<ServiceResponse<List<FoodLogResponseDTO>>> GetAllFoodLogByUser(int userID, DateTime? date = null)
        {
            var query = _context.FoodLogs.Where(f => f.UserID == userID);

            if (date.HasValue)
            {
                var dayStart = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
                var dayEnd = dayStart.AddDays(1);
                query = query.Where(f => f.ConsumedAt >= dayStart && f.ConsumedAt < dayEnd);
            }

            var foodLogs = await query
                .OrderByDescending(f => f.ConsumedAt)
                .Select(f => new FoodLogResponseDTO
                {
                    FoodLogID = f.FoodLogID,
                    FoodName = f.FoodName,
                    Calories = f.Calories,
                    Protein = f.Protein,
                    Carbohydrates = f.Carbohydrates,
                    Fat = f.Fat,
                    ConsumedAt = f.ConsumedAt,
                    UserID = f.UserID
                })
                .ToListAsync();

            return ServiceResponse<List<FoodLogResponseDTO>>.Success(foodLogs);
        }

        public async Task<ServiceResponse<FoodLogResponseDTO>> GetFoodLogById(int foodLogId, int userID)
        {
            var foodLog = await _context.FoodLogs
                .FirstOrDefaultAsync(f => f.FoodLogID == foodLogId && f.UserID == userID);

            return foodLog == null
                ? ServiceResponse<FoodLogResponseDTO>.NotFound("Food log not found.")
                : ServiceResponse<FoodLogResponseDTO>.Success(ToDto(foodLog));
        }

        public async Task<ServiceResponse<FoodLogResponseDTO>> CreateFoodlog(int userId, FoodLogCreateDTO dto)
        {
            var newFoodLog = new FoodLog
            {
                FoodName = dto.FoodName.Trim(),
                Calories = dto.Calories,
                Protein = dto.Protein,
                Carbohydrates = dto.Carbohydrates,
                Fat = dto.Fat,
                ConsumedAt = dto.ConsumedAt.HasValue ? DateTimeHelper.ToUtc(dto.ConsumedAt.Value) : DateTime.UtcNow,
                UserID = userId
            };

            _context.FoodLogs.Add(newFoodLog);
            await _context.SaveChangesAsync();

            return ServiceResponse<FoodLogResponseDTO>.Success(ToDto(newFoodLog));
        }

        public async Task<ServiceResponse<bool>> DeletefoodLog(int foodLogID, int userID)
        {
            var foodLog = await _context.FoodLogs
                .FirstOrDefaultAsync(f => f.FoodLogID == foodLogID && f.UserID == userID);

            if (foodLog == null)
            {
                return ServiceResponse<bool>.NotFound("Food log not found.");
            }

            _context.FoodLogs.Remove(foodLog);
            await _context.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        private static FoodLogResponseDTO ToDto(FoodLog f) => new()
        {
            FoodLogID = f.FoodLogID,
            FoodName = f.FoodName,
            Calories = f.Calories,
            Protein = f.Protein,
            Carbohydrates = f.Carbohydrates,
            Fat = f.Fat,
            ConsumedAt = f.ConsumedAt,
            UserID = f.UserID
        };
    }
}
