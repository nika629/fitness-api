using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using WebApplicationLB.Domain.Entities;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services;

namespace WebApplicationAPI.Tests
{
    // დამხმარე მეთოდები ყველა ტესტისთვის
    internal static class TestHelpers
    {
        // ყოველ ტესტს ახალი, ცარიელი ბაზა მეხსიერებაში (რეალურ ბაზას არ ეხება).
        // ID-ები იგივეა, რაც რეალურ ბაზაში: Admin = 1, User = 2, Barbell = 3, Chest = 12
        internal static ApplicationDbContext CreateDb()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var db = new ApplicationDbContext(options);

            db.Dictionaries.AddRange(
                new Dictionary { DictionaryID = 1, DictionaryGroupIntCode = 1, DictionaryCaption = "Admin", DictionaryItemIntCode = 1 },
                new Dictionary { DictionaryID = 2, DictionaryGroupIntCode = 1, DictionaryCaption = "User", DictionaryItemIntCode = 2 },
                new Dictionary { DictionaryID = 3, DictionaryGroupIntCode = 2, DictionaryCaption = "Barbell", DictionaryItemIntCode = 1 },
                new Dictionary { DictionaryID = 12, DictionaryGroupIntCode = 3, DictionaryCaption = "Chest", DictionaryItemIntCode = 3 });
            db.SaveChanges();

            return db;
        }

        internal static User AddUser(ApplicationDbContext db, string email, string password = "secret123", int roleId = 2)
        {
            var user = new User
            {
                UserName = "Test",
                UserLastName = "User",
                UserEmail = email,
                UserPasswordHash = BCrypt.Net.BCrypt.HashPassword(password, 4),
                UserDictionaryRoleID = roleId
            };
            db.Users.Add(user);
            db.SaveChanges();
            return user;
        }

        internal static Exercise AddExercise(ApplicationDbContext db, string name = "Bench Press")
        {
            var exercise = new Exercise
            {
                ExerciseName = name,
                ExerciseDescription = "test",
                ExerciseDifficulty = "Beginner",
                MuscleGroupDictionaryID = 12,
                EquipmentDictionaryID = 3,
                CreateAt = DateTime.UtcNow
            };
            db.Exercises.Add(exercise);
            db.SaveChanges();
            return exercise;
        }

        internal static TokenService CreateTokenService() => new(new FakeConfiguration(new()
        {
            ["Jwt:Key"] = "test-key-that-is-long-enough-for-hmac-sha256-signing",
            ["Jwt:Issuer"] = "FitnessApp",
            ["Jwt:Audience"] = "FitnessAppUsers",
            ["Jwt:ExpiryInDays"] = "7"
        }));
    }

    // მარტივი IConfiguration, რომ TokenService შევქმნათ appsettings.json-ის გარეშე
    internal sealed class FakeConfiguration : IConfiguration
    {
        private readonly Dictionary<string, string?> _values;

        public FakeConfiguration(Dictionary<string, string?> values)
        {
            _values = values;
        }

        public string? this[string key]
        {
            get => _values.TryGetValue(key, out var value) ? value : null;
            set => _values[key] = value;
        }

        public IEnumerable<IConfigurationSection> GetChildren() => Enumerable.Empty<IConfigurationSection>();

        public IChangeToken GetReloadToken() => throw new NotSupportedException();

        public IConfigurationSection GetSection(string key) => throw new NotSupportedException();
    }
}
