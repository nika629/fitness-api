using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
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


        public async Task<ServiceResponse<bool>> AssignRole(int userID, int roleID)
        {
            var result = new ServiceResponse<bool>();

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(UserService)}.{nameof(AssignRole)} - ERROR: User with ID {userID} not found.";
            }
            else
            {
                var existedRole = await _dbContext.Dictionaries.AnyAsync(r => r.DictionaryID == roleID);

                if (!existedRole)
                {
                    result.IsSuccessful = false;
                    result.ErrorMessage = $"{nameof(UserService)}.{nameof(AssignRole)} - ERROR: Role with ID {roleID} not found.";
                }
                else
                {
                    user.UserDictionaryRoleID = roleID;
                    user.UpdatedAt = DateTime.UtcNow;

                    await _dbContext.SaveChangesAsync();

                    result.IsSuccessful = true;
                    result.Data = true;
                }
            }

            return result;
        }



        public async Task<ServiceResponse<UserResponseDTO?>> GetUserById(int userID)
        {
            var result = new ServiceResponse<UserResponseDTO?>();

            var user = await _dbContext.Users
                .Include(u => u.DictionaryRole)
                .FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(UserService)}.{nameof(GetUserById)} - ERROR: Couldnt get user by ID.";
            }
            else
            {
                result.IsSuccessful = true;
                result.Data = new UserResponseDTO
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

            return result;
        }
        public async Task<ServiceResponse<UserResponseDTO?>> UpdateUser(int userID, UserUpdateDTO Udto)
        {
            var result = new ServiceResponse<UserResponseDTO?>();

            var user = await _dbContext.Users
                .Include(u => u.DictionaryRole)
                .FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null)
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(UserService)}.{nameof(UpdateUser)} - ERROR: Couldn't update user.";
            }
            else
            {
                user.UserName = Udto.UserName ?? user.UserName;
                user.UserLastName = Udto.UserLastName ?? user.UserLastName;
                user.UserPhone = Udto.UserPhone ?? user.UserPhone;
                user.UserAge = Udto.UserAge ?? user.UserAge;
                user.BirthDate = Udto.BirthDate ?? user.BirthDate;
                user.Height = Udto.Height ?? user.Height;
                user.CurrentWeight = Udto.CurrentWeight ?? user.CurrentWeight;
                user.GoalWeight = Udto.GoalWeight ?? user.GoalWeight;
                user.UpdatedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                result.IsSuccessful = true;
                result.Data = new UserResponseDTO
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



            return result;
        }

        public async Task ChangeUserEmail(int userID, ChangeUserEmailDTO Cdto)
        {
            var user = await _dbContext.Users.Include(u => u.DictionaryRole).FirstOrDefaultAsync(u => u.UserID == userID);

            if(user != null)
            {
                var passordHash = BCrypt.Net.BCrypt.Verify(Cdto.CurrentPassword, user.UserPasswordHash);

                if(passordHash)
                {
                    var emailTaken = await _dbContext.Users.AnyAsync(u => u.UserEmail == Cdto.NewEmail);

                    if (emailTaken)
                    {
                        user.UserEmail = Cdto.NewEmail;
                        user.UpdatedAt = DateTime.UtcNow;

                        await _dbContext.SaveChangesAsync();
                    }   
                }
            }
        }


        public async Task ChangeUserPassword(int userID, ChangeUserPasswordDTO Cdto)
        {
            var user = await _dbContext.Users.Include(u => u.DictionaryRole).FirstOrDefaultAsync(u => u.UserID == userID);

            if (user != null)
            {
                var passordHash = BCrypt.Net.BCrypt.Verify(Cdto.CurrentPassword, user.UserPasswordHash);

                if (passordHash)
                {
                    user.UserPasswordHash = BCrypt.Net.BCrypt.HashPassword(Cdto.NewPassword);
                    user.UpdatedAt = DateTime.UtcNow;

                    await _dbContext.SaveChangesAsync();
                }
            }
        }

        public async Task DeleteUser(int userID)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userID);

            if (user != null)
            {
                _dbContext.Users.Remove(user);
                await _dbContext.SaveChangesAsync();
            }
        }
    }
}
