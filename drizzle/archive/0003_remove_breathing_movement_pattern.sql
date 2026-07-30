-- Remove breathing field (74% "Not provided", noise)
alter table source_exercises drop column breathing;

-- Remove movement_pattern field (can be derived from exercise_type)
alter table source_exercises drop column movement_pattern;
