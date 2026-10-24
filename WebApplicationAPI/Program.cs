using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.Filters;
using WebApplicationLB.Infrastructure.DataBase;
using WebApplicationLB.Infrastructure.Services;

namespace WebApplicationAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ---------- Database ----------
            // On the server the real connection string comes from the environment variable
            // ConnectionStrings__DefaultConnection (it overrides appsettings.json).
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddHealthChecks();

            // ---------- Swagger ----------
            builder.Services.AddSwaggerGen(options =>
            {
                // Type = Http + Scheme = bearer: in Swagger "Authorize" paste ONLY the token, without "Bearer "
                options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
                {
                    Description = "Paste the JWT token from /api/Auth/login (without the word Bearer).",
                    In = ParameterLocation.Header,
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });
                options.OperationFilter<SecurityRequirementsOperationFilter>();
            });

            // ---------- CORS ----------
            // Allowed frontend addresses come from "Cors:AllowedOrigins" in appsettings.json
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                                 ?? new[] { "http://localhost:4200" };

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Frontend", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // ---------- Services ----------
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

            // ---------- JWT authentication ----------
            var jwtKey = builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key is not configured.");

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                        ValidateIssuer = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidateAudience = true,
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(1)
                    };
                });

            var app = builder.Build();

            // ---------- HTTP pipeline ----------

            // Nginx sits in front of the app: trust its X-Forwarded-* headers
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });

            // Any unhandled exception -> logged + 500 with a JSON body (no stack trace sent to the client)
            app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
            {
                var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
                var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(exception, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred." });
            }));

            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseHttpsRedirection();
            app.UseCors("Frontend");
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapHealthChecks("/health");
            app.MapControllers();

            app.Run();
        }
    }
}
