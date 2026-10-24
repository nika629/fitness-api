using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
using WebApplicationLB.Domain.Constants;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services.Auth;
using WebApplicationLB.Infrastructure.Services.Token;

namespace WebApplicationLB.Infrastructure.Services
{
    public class AuthService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly TokenService _tokenService;

        public AuthService(ApplicationDbContext dbContext, TokenService tokenService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
        }

        public async Task<ServiceResponse<AuthResponseDTO>> RegisterUser(RegisterUserDTO registerDTO)
        {
            var email = registerDTO.UserEmail.Trim().ToLowerInvariant();

            var emailTaken = await _dbContext.Users.AnyAsync(u => u.UserEmail.ToLower() == email);
            if (emailTaken)
            {
                return ServiceResponse<AuthResponseDTO>.Conflict($"User with email {email} already exists.");
            }

            var defaultRole = await _dbContext.Dictionaries
                .FirstOrDefaultAsync(d => d.DictionaryGroupIntCode == DictionaryGroups.Roles
                                       && d.DictionaryCaption == RoleNames.User);

            var newUser = new User
            {
                UserName = registerDTO.UserName.Trim(),
                UserLastName = registerDTO.UserLastname.Trim(),
                UserEmail = email,
                UserPhone = registerDTO.UserPhone.Trim(),
                UserPasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDTO.UserPassword),
                UserDictionaryRoleID = defaultRole?.DictionaryID,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.Users.AddAsync(newUser);
            await _dbContext.SaveChangesAsync();

            return ServiceResponse<AuthResponseDTO>.Success(
                BuildAuthResponse(newUser.UserID, newUser.UserName, newUser.UserEmail, defaultRole?.DictionaryCaption ?? RoleNames.User));
        }

        public async Task<ServiceResponse<AuthResponseDTO>> LoginUser(LoginUserDTO loginDTO)
        {
            var email = loginDTO.UserEmail.Trim().ToLowerInvariant();

            var user = await _dbContext.Users
                .Include(u => u.DictionaryRole)
                .FirstOrDefaultAsync(u => u.UserEmail.ToLower() == email);

            // Same message for wrong email and wrong password, so nobody can guess which emails exist
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDTO.UserPassword, user.UserPasswordHash))
            {
                return ServiceResponse<AuthResponseDTO>.Fail("Invalid email or password.", 401);
            }

            return ServiceResponse<AuthResponseDTO>.Success(
                BuildAuthResponse(user.UserID, user.UserName, user.UserEmail, user.DictionaryRole?.DictionaryCaption ?? RoleNames.User));
        }

        private AuthResponseDTO BuildAuthResponse(int userId, string userName, string email, string role)
        {
            var token = _tokenService.GenerateToken(new UserDTO
            {
                UserID = userId,
                UserName = userName,
                UserEmail = email,
                RoleName = role
            });

            return new AuthResponseDTO
            {
                Token = token,
                UserID = userId,
                UserName = userName,
                UserEmail = email,
                Role = role
            };
        }
    }
}
