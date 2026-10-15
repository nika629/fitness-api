using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.Exercises;

namespace WebApplicationLB.Infrastructure.Services
{
    public class ExerciseService
    {
        private readonly ApplicationDbContext _context;
        
        public ExerciseService(ApplicationDbContext context)
        {
            _context = context;
        }


        public async Task<ServiceResponse<List<ExerciseResponseDTO>>> GetAllExercises()
        {
            var result = new ServiceResponse<List<ExerciseResponseDTO>>();

            var exercises = await _context.Exercises
                .Select(s => new ExerciseResponseDTO
                {
                    ExerciseID = s.ExerciseID,
                    ExerciseName = s.ExerciseName,
                    ExerciseDescription = s.ExerciseDescription,
                    ExerciseDifficulty = s.ExerciseDifficulty,
                    MuscleGroupID = s.MuscleGroupDictionaryID,
                    EquipmentID = s.EquipmentDictionaryID,
                    UpdatedAt = s.UpdatedAt,
                    CreateAt = s.CreateAt
                })
                .ToListAsync();

            if(exercises == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(ExerciseService)}.{nameof(GetAllExercises)} - ERROR: Couldn't get Exercises.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = exercises;
            }

            return result;

            
        }

        public async Task<ServiceResponse<ExerciseResponseDTO?>> GetExerciseByID(int exerciseId)
        {
            var result = new ServiceResponse<ExerciseResponseDTO?>();

            var exercise = await _context.Exercises
                .FirstOrDefaultAsync(s => s.ExerciseID == exerciseId);

            if (exercise == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(ExerciseService)}.{nameof(GetExerciseByID)} - ERROR: Couldn't get exercises by ID.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = new ExerciseResponseDTO
                {
                    ExerciseID = exercise.ExerciseID,
                    ExerciseName = exercise.ExerciseName,
                    ExerciseDescription = exercise.ExerciseDescription,
                    ExerciseDifficulty = exercise.ExerciseDifficulty,
                    MuscleGroupID = exercise.MuscleGroupDictionaryID,
                    EquipmentID = exercise.EquipmentDictionaryID,
                    CreateAt = exercise.CreateAt,
                    UpdatedAt = exercise.UpdatedAt
                };
            }


            return result;
        }

        public async Task<ServiceResponse<ExerciseResponseDTO>> CreateExercise(ExerciseCreateDTO Cdto)
        {

            var result = new ServiceResponse<ExerciseResponseDTO>();

            var newExercise = new Exercise
            {
                ExerciseName = Cdto.ExerciseName,
                ExerciseDescription = Cdto.ExerciseDescription,
                ExerciseDifficulty = Cdto.ExerciseDifficulty,
                MuscleGroupDictionaryID = Cdto.MuscleGroupID,
                EquipmentDictionaryID = Cdto.EquipmentID,
                CreateAt = DateTime.UtcNow
            };

            if(newExercise == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(ExerciseService)}.{nameof(CreateExercise)} - ERROR: Couldn't create Exercise.";
            }
            else
            {
                result.IsSuccessful = true;
                _context.Exercises.Add(newExercise);
                await _context.SaveChangesAsync();

                result.Data = new ExerciseResponseDTO
                {
                    ExerciseID = newExercise.ExerciseID,
                    ExerciseName = newExercise.ExerciseName,
                    ExerciseDescription = newExercise.ExerciseDescription,
                    ExerciseDifficulty = newExercise.ExerciseDifficulty,
                    MuscleGroupID = newExercise.MuscleGroupDictionaryID,
                    EquipmentID = newExercise.EquipmentDictionaryID,
                    CreateAt = newExercise.CreateAt,
                    UpdatedAt = newExercise.UpdatedAt
                };
            }

            return result;
        }

        public async Task<ServiceResponse<ExerciseResponseDTO?>> UpdateExercise(int exerciseID, ExerciseUpdateDTO dto)
        {

            var result = new ServiceResponse<ExerciseResponseDTO?>();

            var exercise = await _context.Exercises
                .FirstOrDefaultAsync(e => e.ExerciseID == exerciseID);

            if (exercise == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(ExerciseService)}.{nameof(UpdateExercise)} - ERROR: Couldn't update exercise.";
            }
            else
            {
                

                exercise.ExerciseName = dto.ExerciseName ?? exercise.ExerciseName;
                exercise.ExerciseDescription = dto.ExerciseDescription ?? exercise.ExerciseDescription;
                exercise.ExerciseDifficulty = dto.ExerciseDifficulty ?? exercise.ExerciseDifficulty;
                exercise.MuscleGroupDictionaryID = dto.MuscleGroupID ?? exercise.MuscleGroupDictionaryID;
                exercise.EquipmentDictionaryID = dto.EquipmentID ?? exercise.EquipmentDictionaryID;
                exercise.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new ExerciseResponseDTO
                {
                    ExerciseID = exercise.ExerciseID,
                    ExerciseName = exercise.ExerciseName,
                    ExerciseDescription = exercise.ExerciseDescription,
                    ExerciseDifficulty = exercise.ExerciseDifficulty,
                    MuscleGroupID = exercise.MuscleGroupDictionaryID,
                    EquipmentID = exercise.EquipmentDictionaryID,
                    CreateAt = exercise.CreateAt,
                    UpdatedAt = exercise.UpdatedAt
                };
            }
            return result;
        }


        public async Task DeleteExercise(int exerciseID)
        {
            var exercise = await _context.Exercises.FirstOrDefaultAsync(s => s.ExerciseID == exerciseID);

            if(exercise != null)
            {
                _context.Exercises.Remove(exercise);
                await _context.SaveChangesAsync();
            }

        }
    }
}
