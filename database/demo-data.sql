-- =====================================================================
-- Fitness API - DEMO data for the presentation
-- Fills ONE account with: 9 weeks of weight history, 12 finished workouts
-- (last 4 weeks) and food logs for the last 6 days, so the History and
-- Progress pages have something to show.
--
-- Run AFTER seed.sql and after the AddWorkoutSessionsAndWeightLog migration.
-- 1) Change the email on the line marked  <-- CHANGE  to the demo account
-- 2) DBeaver: Alt+X (Execute script)
--
-- Safe to run again: it first removes the demo workouts it created before
-- (Notes = 'demo') and that user's weight history.
-- =====================================================================

DO $$
DECLARE
    v_email   text := 'user@example.com';   -- <-- CHANGE
    v_user    int;
    v_session int;
    v_start   timestamptz;
    v_minutes int;
    w int;
    d int;
BEGIN
    SELECT "UserID" INTO v_user FROM "Users" WHERE lower("UserEmail") = lower(v_email);
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', v_email;
    END IF;

    -- Clean up a previous run
    DELETE FROM "WorkoutSessions" WHERE "UserID" = v_user AND "Notes" = 'demo';
    DELETE FROM "WeightLogs" WHERE "UserID" = v_user;

    -- ---------- Weight: one weigh-in per week, 88.0 kg -> 84.5 kg ----------
    FOR w IN 0..8 LOOP
        INSERT INTO "WeightLogs" ("UserID", "Weight", "LoggedAt")
        VALUES (
            v_user,
            CASE WHEN w = 8 THEN 84.5
                 ELSE round((88.0 - w * 0.42 + (random() - 0.5) * 0.4)::numeric, 1)::double precision END,
            date_trunc('day', NOW()) - make_interval(days => (8 - w) * 7) + interval '8 hours'
        );
    END LOOP;

    UPDATE "Users"
    SET "CurrentWeight" = 84.5,
        "GoalWeight"    = COALESCE("GoalWeight", 80),
        "Height"        = COALESCE("Height", 182)
    WHERE "UserID" = v_user;

    -- ---------- 12 workouts: Push / Pull / Legs, weights slowly going up ----------
    FOR d IN 0..11 LOOP
        v_start   := date_trunc('day', NOW()) - make_interval(days => 27 - (d * 23) / 10) + interval '18 hours';
        v_minutes := 40 + (d * 7) % 16;

        INSERT INTO "WorkoutSessions" ("UserID", "WorkoutPlanID", "PlanName", "StartedAt", "FinishedAt", "DurationMinutes", "Notes")
        VALUES (
            v_user, NULL,
            CASE d % 3 WHEN 0 THEN 'Push day' WHEN 1 THEN 'Pull day' ELSE 'Leg day' END,
            v_start, v_start + make_interval(mins => v_minutes), v_minutes, 'demo'
        )
        RETURNING "WorkoutSessionID" INTO v_session;

        INSERT INTO "WorkoutSessionSets" ("WorkoutSessionID", "ExerciseID", "SetNumber", "Reps", "WeightKg")
        SELECT v_session, e."ExerciseID", s, t.reps, t.kg
        FROM (
            SELECT * FROM (VALUES
                -- day type, order, exercise, sets, reps, kg (NULL = bodyweight)
                (0, 1, 'Bench Press',       4,  8, (50  + d * 1.25)::double precision),
                (0, 2, 'Overhead Press',    3, 10, (30  + d * 0.5 )::double precision),
                (0, 3, 'Push-Up',           3, 15, NULL::double precision),
                (0, 4, 'Triceps Pushdown',  3, 12, 20::double precision),
                (1, 1, 'Deadlift',          3,  5, (80  + d * 2.5 )::double precision),
                (1, 2, 'Pull-Up',           3,  8, NULL::double precision),
                (1, 3, 'Barbell Row',       3, 10, (45  + d * 1.0 )::double precision),
                (1, 4, 'Barbell Curl',      3, 10, 25::double precision),
                (2, 1, 'Back Squat',        4,  8, (60  + d * 2.0 )::double precision),
                (2, 2, 'Leg Press',         3, 12, (100 + d * 2.5 )::double precision),
                (2, 3, 'Lunge',             3, 10, NULL::double precision),
                (2, 4, 'Crunch',            3, 20, NULL::double precision)
            ) AS v(kind, ord, name, sets, reps, kg)
            WHERE v.kind = d % 3
        ) AS t
        JOIN "Exercises" e ON e."ExerciseName" = t.name
        CROSS JOIN generate_series(1, t.sets) AS s
        ORDER BY t.ord, s;
    END LOOP;

    -- ---------- Food: 3 meals a day for the last 6 days (only empty days) ----------
    FOR d IN 1..6 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM "FoodLogs"
            WHERE "UserID" = v_user
              AND "ConsumedAt" >= date_trunc('day', NOW()) - make_interval(days => d)
              AND "ConsumedAt" <  date_trunc('day', NOW()) - make_interval(days => d - 1)
        ) THEN
            INSERT INTO "FoodLogs" ("UserID", "FoodName", "Calories", "Protein", "Carbohydrates", "Fat", "ConsumedAt")
            VALUES
                (v_user, 'Oatmeal with banana', 420 + d * 10, 14, 72, 8,
                 date_trunc('day', NOW()) - make_interval(days => d) + interval '8 hours'),
                (v_user, 'Chicken breast, rice', 640 - d * 15, 52, 70, 12,
                 date_trunc('day', NOW()) - make_interval(days => d) + interval '13 hours 30 minutes'),
                (v_user, CASE WHEN d % 2 = 0 THEN 'Salmon, potatoes' ELSE 'Greek yogurt, nuts' END,
                 CASE WHEN d % 2 = 0 THEN 610 ELSE 380 END,
                 CASE WHEN d % 2 = 0 THEN 38 ELSE 24 END,
                 CASE WHEN d % 2 = 0 THEN 45 ELSE 20 END,
                 CASE WHEN d % 2 = 0 THEN 26 ELSE 18 END,
                 date_trunc('day', NOW()) - make_interval(days => d) + interval '19 hours');
        END IF;
    END LOOP;

    RAISE NOTICE 'Demo data added for user % (ID %)', v_email, v_user;
END $$;
