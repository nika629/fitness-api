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

        public async Task<ServiceResponse<List<FoodLogResponseDTO>>> GetAllFoodLogByUser(int userID)
        {

            var result = new ServiceResponse<List<FoodLogResponseDTO>>();

            var foodlogs = await _context.FoodLogs
                .Where(u => u.UserID == userID)
                .Select(item => new FoodLogResponseDTO
                {
                    FoodName = item.FoodName,
                    Calories = item.Calories,
                    Protein = item.Protein,
                    Carbohydrates = item.Carbohydrates,
                    Fat = item.Fat,
                    UserID = item.UserID,
                }).ToListAsync();

            if (foodlogs == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(FoodLogService)}.{nameof(GetAllFoodLogByUser)} - ERROR: Couldn't get food logs by users.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = foodlogs;
            }

            return result;
        }

        public async Task<FoodLogResponseDTO?> GetFoodLogById(int foodLogId, int userID)
        {
            var foodLog = await _context.FoodLogs.FirstOrDefaultAsync(u => u.FoodLogID == foodLogId);

            if (foodLog == null || foodLog.UserID != userID)
            {
                return null;
            }
                

            return new FoodLogResponseDTO
            {
                FoodLogID = foodLog.FoodLogID,
                FoodName = foodLog.FoodName,
                Fat = foodLog.Fat,
                Calories = foodLog.Calories,
                Protein = foodLog.Protein,
                Carbohydrates = foodLog.Carbohydrates,
                UserID = foodLog.UserID,
                ConsumedAt = foodLog.ConsumedAt
            };
        }

        public async Task<ServiceResponse<FoodLogResponseDTO>> CreateFoodlog(int userId, FoodLogCreateDTO Cdto)
        {
            var result = new ServiceResponse<FoodLogResponseDTO>();

            var newFoodLog = new FoodLog
            {
                FoodName = Cdto.FoodLogName,
                Fat = Cdto.Fat,
                Calories = Cdto.Calories,
                Protein = Cdto.Protein,
                Carbohydrates = Cdto.Carbohydrates,
                ConsumedAt = Cdto.ConsumedAt,
                UserID = userId  
            };

            _context.FoodLogs.Add(newFoodLog);
            await _context.SaveChangesAsync();

            result.IsSuccessful = true;
            result.Data = new FoodLogResponseDTO
            {
                FoodLogID = newFoodLog.FoodLogID,
                FoodName = newFoodLog.FoodName,
                Fat = newFoodLog.Fat,
                Calories = newFoodLog.Calories,
                Protein = newFoodLog.Protein,
                Carbohydrates = newFoodLog.Carbohydrates,
                ConsumedAt = newFoodLog.ConsumedAt,
                UserID = newFoodLog.UserID
            };

            return result;
        }

        public async Task DeletefoodLog(int foodLogID)
        {
            var foodlog = await _context.FoodLogs.FirstOrDefaultAsync(s => s.FoodLogID == foodLogID);

            if (foodlog != null)
            {
                _context.FoodLogs.Remove(foodlog);
                await _context.SaveChangesAsync();
            }
        }
        
    }
}
