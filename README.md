# Fitness API

ფიტნეს აპლიკაციის ბექენდი: მომხმარებლები, ვარჯიშის გეგმები, ვარჯიშების კატალოგი, ფავორიტები და კვების დღიური (კალორიები, ცილა, ნახშირწყლები, ცხიმი).

**ტექნოლოგიები:** C#, ASP.NET Core Web API (.NET 10), Entity Framework Core 10, PostgreSQL (DigitalOcean Managed Database), JWT, Swagger, xUnit, GitHub Actions, DigitalOcean Droplet (Ubuntu + Nginx).

---

## პროექტის სტრუქტურა

```
WebApplicationAPI.slnx
├── WebApplicationAPI/          ← Web API: Controllers, Program.cs, Swagger, JWT, CORS
├── WebApplicationLB/           ← ბიზნეს ლოგიკა და ბაზა
│   ├── Domain/                 ← Entities, Constants, ServiceResponse
│   ├── Infrastructure/
│   │   ├── DataBase/           ← ApplicationDbContext + EF კონფიგურაციები
│   │   └── Services/           ← სერვისები და DTO-ები
│   └── Migrations/             ← EF Core მიგრაციები
├── WebApplicationAPI.Tests/    ← Unit ტესტები (xUnit + EF InMemory)
├── database/                   ← SQL script-ები (seed.sql)
├── deploy/                     ← სერვერის ფაილები (systemd, nginx, env მაგალითი)
└── .github/workflows/ci-cd.yml ← CI/CD pipeline
```

**არქიტექტურა:** Controller → Service → `ApplicationDbContext` (EF Core) → PostgreSQL.
Controller-ები მხოლოდ HTTP-ს ამუშავებენ, ლოგიკა სერვისებშია. სერვისი აბრუნებს `ServiceResponse<T>`-ს (`IsSuccessful`, `Data`, `ErrorMessage`, `StatusCode`), Controller კი მას შესაბამის HTTP პასუხად აქცევს.

---

## მონაცემთა ბაზა

| ცხრილი | აღწერა |
|---|---|
| `Users` | მომხმარებელი (სახელი, ელფოსტა, პაროლის hash, სიმაღლე, წონა, მიზნობრივი წონა, როლი) |
| `Dictionaries` | ლექსიკონი: როლები, აღჭურვილობა, კუნთების ჯგუფები |
| `Exercises` | ვარჯიშები (კუნთების ჯგუფი, აღჭურვილობა, სირთულე) |
| `WorkoutPlans` | მომხმარებლის ვარჯიშის გეგმები |
| `WorkoutExercises` | ვარჯიში გეგმაში (sets, reps, დასვენების დრო, რიგითობა) |
| `FavoriteExercises` | მომხმარებლის ფავორიტი ვარჯიშები (composite key: UserID + ExerciseID) |
| `FoodLogs` | კვების ჩანაწერები |

`Dictionaries` (`DictionaryID`):
* **როლები** (ჯგუფი 1): Admin = 1, User = 2
* **აღჭურვილობა** (ჯგუფი 2): Barbell 3, Ball 4, Bodyweight 5, Machine 6, Cable 7, Kettlebell 8, Resistance Band 9
* **კუნთების ჯგუფები** (ჯგუფი 3): Arms 10, Legs 11, Chest 12, Back 13, Shoulders 14, Core 15

SQL script-ები: [`database/`](database/README.md).

---

## ინსტალაცია და გაშვება (ლოკალურად)

**საჭიროა:** .NET 10 SDK, Visual Studio 2022+ (ან VS Code), PostgreSQL ბაზა.

1. **კლონირება**
   ```
   git clone https://github.com/nika629/fitness-api.git
   ```
2. **ბაზის პაროლი.** Visual Studio-ში `WebApplicationAPI` → მარჯვენა კლიკი → **Manage User Secrets**:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=...;Port=25060;Database=defaultdb;Username=doadmin;Password=...;SSL Mode=Require"
     }
   }
   ```
3. **ბაზის შექმნა** (თუ ცარიელია): Package Manager Console →
   `Update-Database -StartupProject WebApplicationAPI`, შემდეგ `database/seed.sql`.
4. **გაშვება:** `WebApplicationAPI` → **Set as Startup Project** → **Start**.
5. **Swagger:** `http://localhost:5253/swagger`

**ტესტები:** Visual Studio → Test → Run All Tests, ან `dotnet test WebApplicationAPI.slnx`.

---

## ავთენტიფიკაცია და ავტორიზაცია

* `POST /api/Auth/register` და `POST /api/Auth/login` აბრუნებს JWT ტოკენს (`token`, `userID`, `userName`, `userEmail`, `role`).
* დანარჩენ endpoint-ებზე საჭიროა header: `Authorization: Bearer <token>`.
  Swagger-ში: **Authorize** → ჩასვით მხოლოდ ტოკენი.
* პაროლები ინახება **BCrypt** hash-ით.
* **წესები:**
  * მომხმარებელს მხოლოდ **საკუთარ** მონაცემებზე აქვს წვდომა (URL-ში `userID` უნდა ემთხვეოდეს ტოკენის `userID`-ს), სხვა შემთხვევაში `403`.
  * **Admin**-ს ყველაფერზე აქვს წვდომა.
  * ვარჯიშების შექმნა/შეცვლა/წაშლა, ლექსიკონის შევსება და როლის მინიჭება მხოლოდ Admin-ს შეუძლია.
  * ელფოსტის და პაროლის შეცვლა მხოლოდ თავად მომხმარებელს (მიმდინარე პაროლით).

---

## API Endpoints

| Method | URL | ვის შეუძლია | აღწერა |
|---|---|---|---|
| **Auth** ||||
| POST | `/api/Auth/register` | ყველას | რეგისტრაცია |
| POST | `/api/Auth/login` | ყველას | შესვლა, აბრუნებს JWT-ს |
| **User** ||||
| GET | `/api/User/me` | დალოგინებული | საკუთარი პროფილი |
| GET | `/api/User` | Admin | ყველა მომხმარებელი |
| GET | `/api/User/{userID}` | თავად / Admin | პროფილი |
| PUT | `/api/User/{userID}` | თავად / Admin | პროფილის განახლება (მხოლოდ გაგზავნილი ველები) |
| PUT | `/api/User/{userID}/email` | თავად | ელფოსტის შეცვლა |
| PUT | `/api/User/{userID}/password` | თავად | პაროლის შეცვლა |
| PUT | `/api/User/{userID}/assignRole?roleID=1` | Admin | როლის მინიჭება |
| DELETE | `/api/User/{userID}` | თავად / Admin | ანგარიშის წაშლა |
| **Dictionary** ||||
| GET | `/api/Dictionary/group/{groupCode}` | დალოგინებული | 1 = როლები, 2 = აღჭურვილობა, 3 = კუნთები |
| POST | `/api/Dictionary` | Admin | ახალი ჩანაწერი |
| **Exercise** ||||
| GET | `/api/Exercise/exercises?muscleGroupId=&equipmentId=&search=` | დალოგინებული | ვარჯიშები ფილტრით |
| GET | `/api/Exercise/{exerciseID}` | დალოგინებული | ერთი ვარჯიში |
| POST | `/api/Exercise/exercise` | Admin | დამატება |
| PUT | `/api/Exercise/{exerciseID}` | Admin | შეცვლა (მხოლოდ გაგზავნილი ველები) |
| DELETE | `/api/Exercise/{exerciseID}` | Admin | წაშლა (409, თუ გეგმაშია გამოყენებული) |
| **WorkoutPlan** ||||
| GET | `/api/WorkoutPlan/{userID}/workout-plans` | თავად / Admin | გეგმების სია |
| GET | `/api/WorkoutPlan/{userID}/workout-plans/{planID}` | თავად / Admin | ერთი გეგმა |
| POST | `/api/WorkoutPlan/{userID}/workout-plans` | თავად / Admin | შექმნა |
| PUT | `/api/WorkoutPlan/{userID}/workout-plans/{planID}` | თავად / Admin | შეცვლა |
| DELETE | `/api/WorkoutPlan/{userID}/workout-plans/{planID}` | თავად / Admin | წაშლა |
| **WorkoutExercise** ||||
| GET | `/api/WorkoutExercise/{userID}/plans/{planID}/workout-exercises` | თავად / Admin | გეგმის ვარჯიშები |
| GET | `/api/WorkoutExercise/{userID}/workout-exercises/{id}` | თავად / Admin | ერთი |
| POST | `/api/WorkoutExercise/{userID}/workout-exercises` | თავად / Admin | ვარჯიშის დამატება გეგმაში |
| PUT | `/api/WorkoutExercise/{userID}/workout-exercises/{id}` | თავად / Admin | sets/reps/rest შეცვლა |
| DELETE | `/api/WorkoutExercise/{userID}/workout-exercises/{id}` | თავად / Admin | წაშლა |
| **FavoriteExercise** ||||
| GET | `/api/FavoriteExercise/{userID}/favoriteExercises` | თავად / Admin | ფავორიტები |
| GET | `/api/FavoriteExercise/{userID}/favoriteExercise/{exerciseID}` | თავად / Admin | ერთი |
| POST | `/api/FavoriteExercise/{userID}/favoriteExercise` | თავად / Admin | დამატება (409, თუ უკვე არის) |
| DELETE | `/api/FavoriteExercise/{userID}/favoriteExercise/{exerciseID}` | თავად / Admin | წაშლა |
| **FoodLog** ||||
| GET | `/api/FoodLog/{userID}/foodLogs?date=2026-10-24` | თავად / Admin | ჩანაწერები (არასავალდებულო ფილტრი დღით) |
| GET | `/api/FoodLog/{userID}/foodLog/{foodLogID}` | თავად / Admin | ერთი |
| POST | `/api/FoodLog/{userID}/foodLog` | თავად / Admin | დამატება |
| DELETE | `/api/FoodLog/{userID}/foodLog/{foodLogID}` | თავად / Admin | წაშლა |
| **Health** ||||
| GET | `/health` | ყველას | სერვერის მდგომარეობა (CI/CD-სთვის) |

---

## Error handling და logging

* **ვალიდაცია:** DTO-ებზე Data Annotations (`[Required]`, `[EmailAddress]`, `[Range]`, `[Compare]`...). არასწორ მონაცემებზე `[ApiController]` ავტომატურად აბრუნებს `400`-ს ველების შეცდომებით.
* **ბიზნეს შეცდომები** ერთნაირი ფორმით ბრუნდება: `{ "message": "..." }` და სწორი სტატუს კოდი:
  `400` არასწორი მონაცემი · `401` არასწორი ელფოსტა/პაროლი · `403` სხვისი მონაცემი · `404` ვერ მოიძებნა · `409` დუბლიკატი.
* **მოულოდნელი შეცდომები:** გლობალური `UseExceptionHandler` შეცდომას წერს ლოგში (`ILogger`) და კლიენტს უბრუნებს `500 { "message": "An unexpected error occurred." }`, stack trace-ის გარეშე.
* **ლოგები სერვერზე:** `journalctl -u fitnessapi -f`.

---

## Unit ტესტები

`WebApplicationAPI.Tests` (xUnit). ყოველი ტესტი ქმნის ცარიელ **in-memory** ბაზას, ამიტომ რეალურ ბაზას არ ეხება. ტესტები Arrange → Act → Assert სტრუქტურით არის დაწერილი და ამოწმებს:
რეგისტრაციას და login-ს, დუბლიკატ ელფოსტას (409), არასწორ პაროლს (401), როლის მინიჭებას არასწორი ID-ით (400), ელფოსტის შეცვლას არასწორი პაროლით, პროფილის ნაწილობრივ განახლებას, Workout Plan-ის შექმნას UTC დროით, სხვისი გეგმის/FoodLog-ის შეცვლის აკრძალვას და ფავორიტების დუბლიკატს.

---

## CI/CD (GitHub Actions → DigitalOcean)

ფაილი: `.github/workflows/ci-cd.yml`

1. **CI (ყოველ push-ზე და pull request-ზე):** restore → build → **tests** → publish (linux-x64, self-contained).
2. **CD (მხოლოდ `main`-ზე push-ისას, თუ ტესტები გავიდა):** build-ი SSH-ით (`rsync`) აიტვირთება Droplet-ზე `/var/www/fitnessapi`-ში, `fitnessapi` systemd სერვისი გადაიტვირთება და მოწმდება `/health`.

**GitHub Secrets:** `SSH_PRIVATE_KEY`, `SERVER_HOST`, `SERVER_USER`.

**სერვერი:** Nginx (port 80) → Kestrel (`localhost:5000`). საიდუმლოები (ბაზის პაროლი, JWT key) Git-ში **არ ინახება**: სერვერზე ისინი `/etc/fitnessapi.env`-შია (მაგალითი: `deploy/fitnessapi.env.example`) და `appsettings.json`-ს environment variable-ით ცვლის (`ConnectionStrings__DefaultConnection`, `Jwt__Key`).
