using Microsoft.EntityFrameworkCore;
using WebApplicationLB.Domain.Common;
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
            var result = new ServiceResponse<AuthResponseDTO>();

            var existedUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserEmail == registerDTO.UserEmail);

            if (existedUser == null)
            {
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDTO.UserPassword);

                if (passwordHash == null)
                {
                    result.IsSuccessful = false;
                    result.ErrorMessage = $"{nameof(AuthService)}.{nameof(RegisterUser)} - ERROR : Failed to generate password hash.";
                }
                else
                {
                    var defaultRole = await _dbContext.Dictionaries
                        .FirstOrDefaultAsync(d => d.DictionaryGroupIntCode == 1 && d.DictionaryCaption == "User");

                    var newUser = new User
                    {
                        UserName = registerDTO.UserName,
                        UserLastName = registerDTO.UserLastname,
                        UserEmail = registerDTO.UserEmail,
                        UserPhone = registerDTO.UserPhone,
                        UserPasswordHash = passwordHash,
                        UserDictionaryRoleID = defaultRole?.DictionaryID   
                    };

                    await _dbContext.Users.AddAsync(newUser);
                    await _dbContext.SaveChangesAsync();

                    if (newUser.UserID > 0)
                    {
                        var userDTO = new UserDTO
                        {
                            UserID = newUser.UserID,
                            UserName = newUser.UserName,
                            UserEmail = newUser.UserEmail,
                            RoleName = defaultRole?.DictionaryCaption ?? "User"  
                        };

                        var token = _tokenService.GenerateToken(userDTO);

                        var response = new AuthResponseDTO()
                        {
                            Token = token,
                            UserName = newUser.UserName
                        };

                        result.IsSuccessful = true;
                        result.Data = response;
                    }
                    else
                    {
                        result.IsSuccessful = false;
                        result.ErrorMessage = $"{nameof(AuthService)}.{nameof(RegisterUser)} - ERROR : Failed to create user in database.";
                    }
                }
            }
            else
            {
                result.IsSuccessful = false;
                result.ErrorMessage = $"{nameof(AuthService)}.{nameof(RegisterUser)} - ERROR : User with email {registerDTO.UserEmail} already exists.";
            }

            return result;
        }

        public async Task<AuthResponseDTO> LoginUser(LoginUserDTO Rdto)
        {
            var user = await _dbContext.Users
                .Include(u => u.DictionaryRole)   
                .FirstOrDefaultAsync(u => u.UserEmail == Rdto.UserEmail);

            if (user == null)
            {
                throw new Exception("User with this email does not exist.");
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(Rdto.UserPassword, user.UserPasswordHash);

            if (!isPasswordValid)
            {
                throw new Exception("Invalid password.");
            }

            var userDTO = new UserDTO
            {
                UserID = user.UserID,
                UserName = user.UserName,
                UserEmail = user.UserEmail,
                RoleName = user.DictionaryRole?.DictionaryCaption ?? "User"  
            };

            var token = _tokenService.GenerateToken(userDTO);

            return new AuthResponseDTO
            {
                Token = token,
                UserName = user.UserName
            };
        }
    }
}
