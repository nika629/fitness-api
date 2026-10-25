using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Constants;
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

        // Single place that turns an Exercise row into the DTO (translated to SQL by EF)
        private static readonly Expression<Func<Exercise, ExerciseResponseDTO>> ToDto = e => new ExerciseResponseDTO
        {
            ExerciseID = e.ExerciseID,
            ExerciseName = e.ExerciseName,
            ExerciseDescription = e.ExerciseDescription,
            ExerciseDifficulty = e.ExerciseDifficulty,
            MuscleGroupID = e.MuscleGroupDictionaryID,
            MuscleGroupName = e.DictionaryMuscleGroup != null ? e.DictionaryMuscleGroup.DictionaryCaption : null,
            EquipmentID = e.EquipmentDictionaryID,
            EquipmentName = e.DictionaryEquipment != null ? e.DictionaryEquipment.DictionaryCaption : null,
            CreateAt = e.CreateAt,
            UpdatedAt = e.UpdatedAt
        };

        public async Task<ServiceResponse<List<ExerciseResponseDTO>>> GetAllExercises(int? muscleGroupId = null, int? equipmentId = null, string? search = null)
        {
            var query = _context.Exercises.AsQueryable();

            if (muscleGroupId.HasValue)
                query = query.Where(e => e.MuscleGroupDictionaryID == muscleGroupId.Value);

            if (equipmentId.HasValue)
                query = query.Where(e => e.EquipmentDictionaryID == equipmentId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(e => e.ExerciseName.ToLower().Contains(term));
            }

            var exercises = await query
                .OrderBy(e => e.ExerciseName)
                .Select(ToDto)
                .ToListAsync();

            return ServiceResponse<List<ExerciseResponseDTO>>.Success(exercises);
        }

        public async Task<ServiceResponse<ExerciseResponseDTO>> GetExerciseByID(int exerciseId)
        {
            var exercise = await _context.Exercises
                .Where(e => e.ExerciseID == exerciseId)
                .Select(ToDto)
                .FirstOrDefaultAsync();

            return exercise == null
                ? ServiceResponse<ExerciseResponseDTO>.NotFound("Exercise not found.")
                : ServiceResponse<ExerciseResponseDTO>.Success(exercise);
        }

        public async Task<ServiceResponse<ExerciseResponseDTO>> CreateExercise(ExerciseCreateDTO dto)
        {
            var validationError = await ValidateDictionaryIds(dto.MuscleGroupID, dto.EquipmentID);
            if (validationError != null)
            {
                return ServiceResponse<ExerciseResponseDTO>.Fail(validationError);
            }

            var newExercise = new Exercise
            {
                ExerciseName = dto.ExerciseName.Trim(),
                ExerciseDescription = dto.ExerciseDescription.Trim(),
                ExerciseDifficulty = dto.ExerciseDifficulty.Trim(),
                MuscleGroupDictionaryID = dto.MuscleGroupID,
                EquipmentDictionaryID = dto.EquipmentID,
                CreateAt = DateTime.UtcNow
            };

            _context.Exercises.Add(newExercise);
            await _context.SaveChangesAsync();

            return await GetExerciseByID(newExercise.ExerciseID);
        }

        public async Task<ServiceResponse<ExerciseResponseDTO>> UpdateExercise(int exerciseID, ExerciseUpdateDTO dto)
        {
            var exercise = await _context.Exercises.FirstOrDefaultAsync(e => e.ExerciseID == exerciseID);
            if (exercise == null)
            {
                return ServiceResponse<ExerciseResponseDTO>.NotFound("Exercise not found.");
            }

            var validationError = await ValidateDictionaryIds(dto.MuscleGroupID, dto.EquipmentID);
            if (validationError != null)
            {
                return ServiceResponse<ExerciseResponseDTO>.Fail(validationError);
            }

            // Only overwrite the fields that were actually sent
            if (!string.IsNullOrWhiteSpace(dto.ExerciseName)) exercise.ExerciseName = dto.ExerciseName.Trim();
            if (dto.ExerciseDescription != null) exercise.ExerciseDescription = dto.ExerciseDescription.Trim();
            if (!string.IsNullOrWhiteSpace(dto.ExerciseDifficulty)) exercise.ExerciseDifficulty = dto.ExerciseDifficulty.Trim();
            if (dto.MuscleGroupID.HasValue) exercise.MuscleGroupDictionaryID = dto.MuscleGroupID.Value;
            if (dto.EquipmentID.HasValue) exercise.EquipmentDictionaryID = dto.EquipmentID.Value;
            exercise.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetExerciseByID(exercise.ExerciseID);
        }

        public async Task<ServiceResponse<bool>> DeleteExercise(int exerciseID)
        {
            var exercise = await _context.Exercises.FirstOrDefaultAsync(e => e.ExerciseID == exerciseID);
            if (exercise == null)
            {
                return ServiceResponse<bool>.NotFound("Exercise not found.");
            }

            var usedInPlans = await _context.WorkoutExercises.AnyAsync(w => w.ExerciseID == exerciseID);
            if (usedInPlans)
            {
                return ServiceResponse<bool>.Conflict("This exercise is used in a workout plan and cannot be deleted.");
            }

            var usedInHistory = await _context.WorkoutSessionSets.AnyAsync(s => s.ExerciseID == exerciseID);
            if (usedInHistory)
            {
                return ServiceResponse<bool>.Conflict("This exercise is used in workout history and cannot be deleted.");
            }

            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        // Returns an error message, or null when the IDs are valid
        private async Task<string?> ValidateDictionaryIds(int? muscleGroupId, int? equipmentId)
        {
            if (muscleGroupId.HasValue)
            {
                var ok = await _context.Dictionaries.AnyAsync(d =>
                    d.DictionaryID == muscleGroupId.Value && d.DictionaryGroupIntCode == DictionaryGroups.MuscleGroups);
                if (!ok) return $"Muscle group with ID {muscleGroupId} does not exist.";
            }

            if (equipmentId.HasValue)
            {
                var ok = await _context.Dictionaries.AnyAsync(d =>
                    d.DictionaryID == equipmentId.Value && d.DictionaryGroupIntCode == DictionaryGroups.Equipment);
                if (!ok) return $"Equipment with ID {equipmentId} does not exist.";
            }

            return null;
        }
    }
}
