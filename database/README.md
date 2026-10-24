# Database scripts

| File | What it does |
|---|---|
| `schema.sql` | Creates all tables. Generate it from the EF migrations (see below). |
| `seed.sql` | Start data: roles (Admin = 1, User = 2), equipment, muscle groups and 23 exercises. |

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
