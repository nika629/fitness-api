using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.FavoriteExercises;

namespace WebApplicationLB.Infrastructure.Services
{
    public class FavoriteExerciseService
    {
        private readonly ApplicationDbContext _context;

        public FavoriteExerciseService(ApplicationDbContext context)
        {
            _context = context;
        }

        private IQueryable<FavoriteExerciseResponseDTO> QueryForUser(int userID) =>
            _context.FavoriteExercises
                .Where(f => f.UserID == userID)
                .Select(f => new FavoriteExerciseResponseDTO
                {
                    ExerciseID = f.ExerciseID,
                    ExerciseName = f.Exercise!.ExerciseName,
                    ExerciseDescription = f.Exercise.ExerciseDescription,
                    ExerciseDifficulty = f.Exercise.ExerciseDifficulty,
                    MuscleGroupName = f.Exercise.DictionaryMuscleGroup != null ? f.Exercise.DictionaryMuscleGroup.DictionaryCaption : null,
                    EquipmentName = f.Exercise.DictionaryEquipment != null ? f.Exercise.DictionaryEquipment.DictionaryCaption : null
                });

        public async Task<ServiceResponse<List<FavoriteExerciseResponseDTO>>> GetAllFavoritesByUser(int userID)
        {
            var favorites = await QueryForUser(userID)
                .OrderBy(f => f.ExerciseName)
                .ToListAsync();

            return ServiceResponse<List<FavoriteExerciseResponseDTO>>.Success(favorites);
        }

        public async Task<ServiceResponse<FavoriteExerciseResponseDTO>> GetFavoriteExerciseByID(int exerciseID, int userID)
        {
            var favorite = await QueryForUser(userID)
                .FirstOrDefaultAsync(f => f.ExerciseID == exerciseID);

            return favorite == null
                ? ServiceResponse<FavoriteExerciseResponseDTO>.NotFound("Favorite exercise not found.")
                : ServiceResponse<FavoriteExerciseResponseDTO>.Success(favorite);
        }

        public async Task<ServiceResponse<FavoriteExerciseResponseDTO>> CreateFavoriteExercise(int userID, FavoriteExerciseCreateDTO dto)
        {
            var exerciseExists = await _context.Exercises.AnyAsync(e => e.ExerciseID == dto.ExerciseID);
            if (!exerciseExists)
            {
                return ServiceResponse<FavoriteExerciseResponseDTO>.NotFound("Exercise not found.");
            }

            var alreadyFavorite = await _context.FavoriteExercises
                .AnyAsync(f => f.UserID == userID && f.ExerciseID == dto.ExerciseID);
            if (alreadyFavorite)
            {
                return ServiceResponse<FavoriteExerciseResponseDTO>.Conflict("Exercise is already in favorites.");
            }

            _context.FavoriteExercises.Add(new FavoriteExercise
            {
                UserID = userID,
                ExerciseID = dto.ExerciseID
            });
            await _context.SaveChangesAsync();

            return await GetFavoriteExerciseByID(dto.ExerciseID, userID);
        }

        public async Task<ServiceResponse<bool>> DeleteFavoriteExercise(int exerciseID, int userID)
        {
            var favorite = await _context.FavoriteExercises
                .FirstOrDefaultAsync(f => f.ExerciseID == exerciseID && f.UserID == userID);

            if (favorite == null)
            {
                return ServiceResponse<bool>.NotFound("Favorite exercise not found.");
            }

            _context.FavoriteExercises.Remove(favorite);
            await _context.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }
    }
}
