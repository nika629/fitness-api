using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Users;

namespace WebApplicationAPI.Tests
{
    public class UserServiceTests
    {
        // ზუსტად ის ბაგი, რაც Swagger-ში გქონდათ: roleID=3 არის Barbell და არა როლი -> 400
        [Fact]
        public async Task AssignRole_IdThatIsNotARole_Returns400()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com");
            var service = new UserService(db);

            var result = await service.AssignRole(user.UserID, 3);

            Assert.Equal(400, result.StatusCode);
        }

        // ელფოსტის შეცვლა არასწორი პაროლით არ უნდა მოხდეს
        [Fact]
        public async Task ChangeEmail_WrongPassword_Returns400()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com", "secret123");
            var service = new UserService(db);

            var result = await service.ChangeUserEmail(user.UserID,
                new ChangeUserEmailDTO { NewEmail = "new@test.com", CurrentPassword = "wrong" });

            Assert.Equal(400, result.StatusCode);
        }

        // პროფილის განახლებისას იცვლება მხოლოდ გაგზავნილი ველი
        [Fact]
        public async Task UpdateUser_OnlySentFieldChanges()
        {
            using var db = TestHelpers.CreateDb();
            var user = TestHelpers.AddUser(db, "user@test.com");
            var service = new UserService(db);

            var result = await service.UpdateUser(user.UserID, new UserUpdateDTO { CurrentWeight = 80 });

            Assert.Equal(80.0, result.Data!.CurrentWeight);
            Assert.Equal("Test", result.Data.UserName);   // სახელი არ წაშლილა
        }
    }
}
