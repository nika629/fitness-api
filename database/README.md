# Database scripts

| File | What it does |
|---|---|
| `schema.sql` | Creates all tables. Generate it from the EF migrations (see below). |
| `seed.sql` | Start data: roles (Admin = 1, User = 2), equipment, muscle groups and 23 exercises. |
| `demo-data.sql` | Demo data for ONE account (change the email inside): 9 weeks of weight history, 12 workouts, 6 days of food. For the presentation. |

## Create the database from zero

**Option A – Entity Framework (recommended)**

Visual Studio → *Tools → NuGet Package Manager → Package Manager Console*, Default project = `WebApplicationLB`:

```
Update-Database -StartupProject WebApplicationAPI
```

**Option B – plain SQL**

1. Generate the schema script once (Package Manager Console):
   ```
   Script-Migration -StartupProject WebApplicationAPI -Output database/schema.sql
   ```
2. Run `schema.sql`, then `seed.sql` (DBeaver: Alt+X).

## Update an existing database (new tables)

The `AddWorkoutSessionsAndWeightLog` migration adds `WorkoutSessions`, `WorkoutSessionSets` and `WeightLogs`.
Existing data is not touched. Package Manager Console, Default project = `WebApplicationLB`:

```
Add-Migration AddWorkoutSessionsAndWeightLog -StartupProject WebApplicationAPI
Update-Database -StartupProject WebApplicationAPI
```

(`Add-Migration` is needed only once, by whoever adds the feature; afterwards the migration file is in Git.)
