-- =====================================================================
-- Fitness API - start data (run AFTER the EF migrations created the tables)
-- Roles, equipment, muscle groups and 23 exercises.
-- Run once, e.g. in DBeaver with Alt+X (Execute script).
-- =====================================================================

-- Dictionaries: group 1 = Roles, group 2 = Equipment, group 3 = Muscle groups
INSERT INTO "Dictionaries" ("DictionaryID","DictionaryGroupIntCode","DictionaryCaption","DictionaryItemIntCode","DictionaryParentID") VALUES
(1, 1,'Admin',1,NULL),
(2, 1,'User',2,NULL),
(3, 2,'Barbell',1,NULL),
(4, 2,'Ball',2,NULL),
(5, 2,'Bodyweight',3,NULL),
(6, 2,'Machine',4,NULL),
(7, 2,'Cable',5,NULL),
(8, 2,'Kettlebell',6,NULL),
(9, 2,'Resistance Band',7,NULL),
(10,3,'Arms',1,NULL),
(11,3,'Legs',2,NULL),
(12,3,'Chest',3,NULL),
(13,3,'Back',4,NULL),
(14,3,'Shoulders',5,NULL),
(15,3,'Core',6,NULL);

-- Next DictionaryID will be 16
SELECT setval(pg_get_serial_sequence('"Dictionaries"','DictionaryID'), 15);

-- Exercises (MuscleGroupDictionaryID / EquipmentDictionaryID = DictionaryID above)
INSERT INTO "Exercises" ("ExerciseName","ExerciseDescription","ExerciseDifficulty","MuscleGroupDictionaryID","EquipmentDictionaryID","CreateAt") VALUES
('Bench Press','Lie on a flat bench and press the barbell up from chest level.','Intermediate',12,3,NOW()),
('Machine Chest Fly','Bring the machine handles together in front of your chest.','Beginner',12,6,NOW()),
('Push-Up','Lower your body to the floor and push back up, keeping a straight line.','Beginner',12,5,NOW()),
('Cable Crossover','Pull cable handles down and together in front of the chest.','Intermediate',12,7,NOW()),
('Deadlift','Lift the barbell from the floor to hip level with a straight back.','Advanced',13,3,NOW()),
('Pull-Up','Hang from a bar and pull your chin above it.','Intermediate',13,5,NOW()),
('Lat Pulldown','Pull the bar down to the upper chest while seated.','Beginner',13,6,NOW()),
('Barbell Row','Bend forward and row the barbell to your lower chest.','Intermediate',13,3,NOW()),
('Back Squat','Squat with the barbell on your upper back until thighs are parallel.','Intermediate',11,3,NOW()),
('Lunge','Step forward and lower the back knee toward the floor.','Beginner',11,5,NOW()),
('Leg Press','Push the platform away with your feet on the leg press machine.','Beginner',11,6,NOW()),
('Kettlebell Swing','Swing the kettlebell to chest height by driving the hips forward.','Intermediate',11,8,NOW()),
('Overhead Press','Press the barbell from shoulders to overhead while standing.','Intermediate',14,3,NOW()),
('Cable Lateral Raise','Raise the cable handle out to the side up to shoulder height.','Beginner',14,7,NOW()),
('Face Pull','Pull a rope attachment toward your face with elbows high.','Beginner',14,7,NOW()),
('Barbell Curl','Curl the barbell up toward your shoulders, keeping elbows still.','Beginner',10,3,NOW()),
('Band Curl','Curl a resistance band up while keeping elbows at your sides.','Beginner',10,9,NOW()),
('Triceps Pushdown','Push the cable bar down until your arms are fully extended.','Beginner',10,7,NOW()),
('Dips','Lower your body between parallel bars and push back up.','Intermediate',10,5,NOW()),
('Plank','Hold a straight body position on your forearms and toes.','Beginner',15,5,NOW()),
('Crunch','Lift your shoulders off the floor by contracting the abs.','Beginner',15,5,NOW()),
('Russian Twist','Sit with knees bent and rotate the torso side to side holding a ball.','Intermediate',15,4,NOW()),
('Band Pallof Press','Press a resistance band forward while resisting rotation.','Intermediate',15,9,NOW());
