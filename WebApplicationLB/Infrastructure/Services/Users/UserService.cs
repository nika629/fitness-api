using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Constants;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.Users;

namespace WebApplicationLB.Infrastructure.Services
{
    public class UserService
    {
        private readonly ApplicationDbContext _dbContext;

        public UserService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ServiceResponse<List<UserResponseDTO>>> GetAllUsers()
        {
            var users = await _dbContext.Users
                .Include(u => u.DictionaryRole)
                .OrderBy(u => u.UserID)
                .ToListAsync();

            return ServiceResponse<List<UserResponseDTO>>.Success(users.Select(ToDto).ToList());
        }

        public async Task<ServiceResponse<bool>> AssignRole(int userID, int roleID)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userID);
            if (user == null)
            {
                return ServiceResponse<bool>.NotFound($"User with ID {userID} not found.");
            }

            // roleID is the DictionaryID of a role row (Admin = 1, User = 2)
            var roleExists = await _dbContext.Dictionaries
                .AnyAsync(r => r.DictionaryID == roleID && r.DictionaryGroupIntCode == DictionaryGroups.Roles);
            if (!roleExists)
            {
                return ServiceResponse<bool>.Fail($"Role with ID {roleID} not found.");
            }

            user.UserDictionaryRoleID = roleID;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        public async Task<ServiceResponse<UserResponseDTO>> GetUserById(int userID)
        {
            var user = await _dbContext.Users
                .Include(u => u.DictionaryRole)
                .FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null)
            {
                return ServiceResponse<UserResponseDTO>.NotFound("User not found.");
            }

            return ServiceResponse<UserResponseDTO>.Success(ToDto(user));
        }

        public async Task<ServiceResponse<UserResponseDTO>> UpdateUser(int userID, UserUpdateDTO dto)
        {
            var user = await _dbContext.Users
                .Include(u => u.DictionaryRole)
                .FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null)
            {
                return ServiceResponse<UserResponseDTO>.NotFound("User not found.");
            }

            // Only overwrite the fields that were actually sent
            if (!string.IsNullOrWhiteSpace(dto.UserName)) user.UserName = dto.UserName.Trim();
            if (!string.IsNullOrWhiteSpace(dto.UserLastName)) user.UserLastName = dto.UserLastName.Trim();
            if (dto.UserPhone != null) user.UserPhone = dto.UserPhone.Trim();
            if (dto.UserAge.HasValue) user.UserAge = dto.UserAge;
            if (dto.BirthDate.HasValue) user.BirthDate = DateTimeHelper.ToUtc(dto.BirthDate);
            if (dto.Height.HasValue) user.Height = dto.Height;
            if (dto.CurrentWeight.HasValue && dto.CurrentWeight != user.CurrentWeight)
            {
                // A new weight also goes into the history used by the progress chart
                _dbContext.WeightLogs.Add(new WeightLog
                {
                    UserID = user.UserID,
                    Weight = dto.CurrentWeight.Value,
                    LoggedAt = DateTime.UtcNow
                });
                user.CurrentWeight = dto.CurrentWeight;
            }
            if (dto.GoalWeight.HasValue) user.GoalWeight = dto.GoalWeight;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return ServiceResponse<UserResponseDTO>.Success(ToDto(user));
        }

        public async Task<ServiceResponse<bool>> ChangeUserEmail(int userID, ChangeUserEmailDTO dto)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userID);
            if (user == null)
            {
                return ServiceResponse<bool>.NotFound("User not found.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.UserPasswordHash))
            {
                return ServiceResponse<bool>.Fail("Current password is incorrect.");
            }

            var newEmail = dto.NewEmail.Trim().ToLowerInvariant();
            var emailTaken = await _dbContext.Users
                .AnyAsync(u => u.UserID != userID && u.UserEmail.ToLower() == newEmail);
            if (emailTaken)
            {
                return ServiceResponse<bool>.Conflict("This email is already in use.");
            }

            user.UserEmail = newEmail;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        public async Task<ServiceResponse<bool>> ChangeUserPassword(int userID, ChangeUserPasswordDTO dto)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userID);
            if (user == null)
            {
                return ServiceResponse<bool>.NotFound("User not found.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.UserPasswordHash))
            {
                return ServiceResponse<bool>.Fail("Current password is incorrect.");
            }

            user.UserPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        public async Task<ServiceResponse<bool>> DeleteUser(int userID)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userID);
            if (user == null)
            {
                return ServiceResponse<bool>.NotFound("User not found.");
            }

            _dbContext.Users.Remove(user);
            await _dbContext.SaveChangesAsync();

            return ServiceResponse<bool>.Success(true);
        }

        private static UserResponseDTO ToDto(User user) => new()
        {
            UserID = user.UserID,
            UserName = user.UserName,
            UserLastName = user.UserLastName,
            UserPhone = user.UserPhone,
            UserRoleName = user.DictionaryRole?.DictionaryCaption ?? "No Role Assigned",
            UserEmail = user.UserEmail,
            UserAge = user.UserAge,
            CurrentWeight = user.CurrentWeight,
            BirthDate = user.BirthDate,
            Height = user.Height,
            GoalWeight = user.GoalWeight,
            CreatedAt = user.CreatedAt
        };
    }
}
