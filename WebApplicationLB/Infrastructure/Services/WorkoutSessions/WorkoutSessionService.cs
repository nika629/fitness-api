using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.WorkoutSessions;

namespace WebApplicationLB.Infrastructure.Services
{
    // Saves finished workouts and returns the workout history
    public class WorkoutSessionService
    {
        private readonly ApplicationDbContext _context;

        public WorkoutSessionService(ApplicationDbContext context)
        {
            _context = context;
        }

        // History list, newest first. Totals are calculated by the database.
        public async Task<ServiceResponse<List<WorkoutSessionResponseDTO>>> GetSessionsByUser(int userID)
        {
            var sessions = await _context.WorkoutSessions
                .Where(s => s.UserID == userID)
                .OrderByDescending(s => s.StartedAt)
                .Select(s => new WorkoutSessionResponseDTO
                {
                    WorkoutSessionID = s.WorkoutSessionID,
                    UserID = s.UserID,
                    WorkoutPlanID = s.WorkoutPlanID,
                    PlanName = s.PlanName,
                    StartedAt = s.StartedAt,
                    FinishedAt = s.FinishedAt,
                    DurationMinutes = s.DurationMinutes,
                    Notes = s.Notes,
                    TotalSets = s.Sets.Count,
                    TotalReps = s.Sets.Sum(x => x.Reps),
                    TotalVolumeKg = s.Sets.Sum(x => x.Reps * (x.WeightKg ?? 0))
                })
                .ToListAsync();

            return ServiceResponse<List<WorkoutSessionResponseDTO>>.Success(sessions);
        }

        // One session with all of its sets
        public async Task<ServiceResponse<WorkoutSessionResponseDTO>> GetSessionById(int sessionID, int userID)
        {
            var session = await _context.WorkoutSessions
                .Include(s => s.Sets)
                    .ThenInclude(x => x.Exercise)
                .FirstOrDefaultAsync(s => s.WorkoutSessionID == sessionID && s.UserID == userID);

            return session == null
                ? ServiceResponse<WorkoutSessionResponseDTO>.NotFound("Workout session not found.")
                : ServiceResponse<WorkoutSessionResponseDTO>.Success(ToDto(session));
        }

        public async Task<ServiceResponse<WorkoutSessionResponseDTO>> CreateSession(int userID, WorkoutSessionCreateDTO dto)
        {
            var startedAt = DateTimeHelper.ToUtc(dto.StartedAt);
            var finishedAt = DateTimeHelper.ToUtc(dto.FinishedAt);

            if (finishedAt <= startedAt)
            {
                return ServiceResponse<WorkoutSessionResponseDTO>.Fail("Finish time must be after the start time.");
            }

            if (dto.Sets.Count == 0)
            {
                return ServiceResponse<WorkoutSessionResponseDTO>.Fail("A workout needs at least one set.");
            }

            // The plan (if any) must belong to this user. Its name is saved as a snapshot.
            var planName = "Free workout";
            if (dto.WorkoutPlanID.HasValue)
            {
                var plan = await _context.WorkoutPlans
                    .FirstOrDefaultAsync(p => p.WorkoutPlanID == dto.WorkoutPlanID.Value && p.UserID == userID);
                if (plan == null)
                {
                    return ServiceResponse<WorkoutSessionResponseDTO>.NotFound("Workout plan not found.");
                }
                planName = plan.WorkoutPlanName;
            }

            // Every exercise in the sets must exist
            var exerciseIds = dto.Sets.Select(s => s.ExerciseID).Distinct().ToList();
            var foundCount = await _context.Exercises.CountAsync(e => exerciseIds.Contains(e.ExerciseID));
            if (foundCount != exerciseIds.Count)
            {
                return ServiceResponse<WorkoutSessionResponseDTO>.Fail("One or more exercises do not exist.");
            }

            var session = new WorkoutSession
            {
                UserID = userID,
                WorkoutPlanID = dto.WorkoutPlanID,
                PlanName = planName,
                StartedAt = startedAt,
                FinishedAt = finishedAt,
                DurationMinutes = Math.Max(1, (int)Math.Round((finishedAt - startedAt).TotalMinutes)),
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                Sets = dto.Sets.Select(s => new WorkoutSessionSet
                {
                    ExerciseID = s.ExerciseID,
                    SetNumber = s.SetNumber,
                    Reps = s.Reps,
                    WeightKg = s.WeightKg
                }).ToList()
            };

            // The session and all of its sets are saved in one transaction
            _context.WorkoutSessions.Add(session);
            await _context.SaveChangesAsync();

            return await GetSessionById(session.WorkoutSessionID, userID);
        }

        public async Task<ServiceResponse<bool>> DeleteSession(int sessionID, int userID)
        {
            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(s => s.WorkoutSessionID == sessionID && s.UserID == userID);

            if (session == null)
            {
                return ServiceResponse<bool>.NotFound("Workout session not found.");
            }

            // The sets are removed by the database (ON DELETE CASCADE)
            _context.WorkoutSessions.Remove(session);
            await _context.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        private static WorkoutSessionResponseDTO ToDto(WorkoutSession s) => new()
        {
            WorkoutSessionID = s.WorkoutSessionID,
            UserID = s.UserID,
            WorkoutPlanID = s.WorkoutPlanID,
            PlanName = s.PlanName,
            StartedAt = s.StartedAt,
            FinishedAt = s.FinishedAt,
            DurationMinutes = s.DurationMinutes,
            Notes = s.Notes,
            TotalSets = s.Sets.Count,
            TotalReps = s.Sets.Sum(x => x.Reps),
            TotalVolumeKg = s.Sets.Sum(x => x.Reps * (x.WeightKg ?? 0)),
            Sets = s.Sets
                .OrderBy(x => x.WorkoutSessionSetID)
                .Select(x => new WorkoutSessionSetResponseDTO
                {
                    WorkoutSessionSetID = x.WorkoutSessionSetID,
                    ExerciseID = x.ExerciseID,
                    ExerciseName = x.Exercise?.ExerciseName ?? string.Empty,
                    SetNumber = x.SetNumber,
                    Reps = x.Reps,
                    WeightKg = x.WeightKg
                })
                .ToList()
        };
    }
}
