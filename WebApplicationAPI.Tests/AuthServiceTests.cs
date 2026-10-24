using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Auth;

namespace WebApplicationAPI.Tests
{
    public class AuthServiceTests
    {
        // რეგისტრაციისას ახალი მომხმარებელი User როლს და ტოკენს იღებს
        [Fact]
        public async Task Register_NewUser_GetsUserRoleAndToken()
        {
            // Arrange (მომზადება)
            using var db = TestHelpers.CreateDb();
            var service = new AuthService(db, TestHelpers.CreateTokenService());

            // Act (მოქმედება)
            var result = await service.RegisterUser(new RegisterUserDTO
            {
                UserName = "Nika",
                UserLastname = "Test",
                UserEmail = "nika@test.com",
                UserPassword = "secret123"
            });

            // Assert (შემოწმება)
            Assert.True(result.IsSuccessful);
            Assert.Equal("User", result.Data!.Role);
            Assert.False(string.IsNullOrEmpty(result.Data.Token));
        }

        // ერთი ელფოსტით მეორედ რეგისტრაცია -> 409 Conflict
        [Fact]
        public async Task Register_SameEmailTwice_Returns409()
        {
            using var db = TestHelpers.CreateDb();
            TestHelpers.AddUser(db, "nika@test.com");
            var service = new AuthService(db, TestHelpers.CreateTokenService());

            var result = await service.RegisterUser(new RegisterUserDTO
            {
                UserName = "Nika",
                UserLastname = "Test",
                UserEmail = "nika@test.com",
                UserPassword = "secret123"
            });

            Assert.Equal(409, result.StatusCode);
        }

        // არასწორი პაროლი -> 401 (და არა 500)
        [Fact]
        public async Task Login_WrongPassword_Returns401()
        {
            using var db = TestHelpers.CreateDb();
            TestHelpers.AddUser(db, "user@test.com", "correct-password");
            var service = new AuthService(db, TestHelpers.CreateTokenService());

            var result = await service.LoginUser(new LoginUserDTO { UserEmail = "user@test.com", UserPassword = "wrong" });

            Assert.Equal(401, result.StatusCode);
        }
    }
}
