using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.FavoriteExercises;

namespace WebApplicationLB.Infrastructure.Services
{
    public  class FavoriteExerciseService
    {
        private readonly ApplicationDbContext _context;

        public FavoriteExerciseService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<List<FavoriteExerciseResponseDTO>>> GetAllFavoritesByUser(int userID)
        {

            var result = new ServiceResponse<List<FavoriteExerciseResponseDTO>>();

            var favorites = await _context.FavoriteExercises
                .Where(f => f.UserID == userID)
                .Include(f => f.Exercise)
                .Select(f => new FavoriteExerciseResponseDTO
                {
                    ExerciseID = f.ExerciseID,
                    ExerciseName = f.Exercise.ExerciseName,
                    
                })
                .ToListAsync();
            
            if(favorites == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(FavoriteExerciseService)}.{nameof(GetAllFavoritesByUser)} - ERROR: Couldn't get favorite exercises by user.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = favorites;
            }

            return result;
        }

        public async Task<ServiceResponse<FavoriteExerciseResponseDTO>> GetFavoriteExerciseByID(int exerciseID, int userID)
        {
            var result = new ServiceResponse<FavoriteExerciseResponseDTO>();

            var favoriteExercise = await _context.FavoriteExercises
                .Include(f => f.Exercise)
                .FirstOrDefaultAsync(s => s.ExerciseID == exerciseID && s.UserID == userID);

            if(favoriteExercise == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(FavoriteExerciseService)}.{nameof(GetFavoriteExerciseByID)} - ERROR: Couldn't get favorite exercise by ID.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = new FavoriteExerciseResponseDTO
                {
                    ExerciseID = favoriteExercise.ExerciseID,
                    ExerciseName = favoriteExercise.Exercise.ExerciseName,

                };
            }

            return result;
        }

        public async Task<ServiceResponse<FavoriteExerciseResponseDTO>> CreateFavoriteExercise(int userID, FavoriteExerciseCreateDTO Cdto)
        {

            var result = new ServiceResponse<FavoriteExerciseResponseDTO>();

            var newFavoriteExercise = new FavoriteExercise
            {
                UserID = userID,
                ExerciseID = Cdto.ExerciseID
            };

            if(newFavoriteExercise == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(FavoriteExerciseService)}.{nameof(CreateFavoriteExercise)} - ERROR: Couldn't create favorite exercise.";
            }
            else
            {
                _context.FavoriteExercises.Add(newFavoriteExercise);
                await _context.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new FavoriteExerciseResponseDTO
                {
                    ExerciseID = newFavoriteExercise.ExerciseID,
                    ExerciseName = newFavoriteExercise.Exercise.ExerciseName,

                };
            }

            return result;
        }

        [Obsolete("Needs to be reviewed")]
        public async Task DeleteFavoriteExercise(int exerciseID, int userID)
        {
            var favExercise = await _context.FavoriteExercises.FirstOrDefaultAsync(i => i.ExerciseID == exerciseID && i.UserID == userID);

            if (favExercise == null)
            {
                // ErrorMessage
            }
            else
            {
                _context.FavoriteExercises.Remove(favExercise);
                await _context.SaveChangesAsync();
            }
        }
    }
}