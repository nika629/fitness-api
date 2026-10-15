using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.Filters;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services;
using WebApplicationLB.Infrastructure.Services.Dictionaries;

namespace WebApplicationAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
                {
                    Description = "Standard authorization header using the bearer scheme. Example : \"bearer {token}\"",
                    In = ParameterLocation.Header,
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey
                });
                options.OperationFilter<SecurityRequirementsOperationFilter>();
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAngularApp", policy =>
                {
                    policy.WithOrigins("http://localhost:4200")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            builder.Services.AddScoped<TokenService>();
            builder.Services.AddScoped<AuthService>();
            builder.Services.AddScoped<ExerciseService>();
            builder.Services.AddScoped<FavoriteExerciseService>();
            builder.Services.AddScoped<FoodLogService>();
            builder.Services.AddScoped<UserService>();
            builder.Services.AddScoped<WorkoutExerciseService>();
            builder.Services.AddScoped<WorkoutPlanService>();
            builder.Services.AddScoped<RoleService>();
            builder.Services.AddScoped<DictionaryService>();

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
              .AddJwtBearer(options =>
              options.TokenValidationParameters = new TokenValidationParameters
              {
                  ValidateIssuerSigningKey = true,
                  IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration.GetSection("Jwt:Key").Value)),
                  ValidateIssuer = false,
                  ValidateAudience = false
              });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseHttpsRedirection();
            app.UseCors("AllowAngularApp");
            app.UseAuthentication();   
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
