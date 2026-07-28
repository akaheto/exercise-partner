# Exercise Guidance Architecture

## Overview

The guidance system uses a **two-table pattern-based architecture** to prescribe exercise parameters (sets, reps, RPE, tempo, breathing) based on user experience level and training goal.

### Design Goals

1. **Maintainability**: Update guidance once (in patterns), all exercises using it inherit changes
2. **Scalability**: 15 patterns cover 1,218 exercises without redundancy
3. **Customization**: Exercise-specific overrides layer on top of patterns
4. **Clarity**: Separation of canonical patterns from exercise-specific data

## Tables

### `guidance_patterns` (15 rows)

Canonical templates for each (experience_level, training_goal) combination.

```sql
SELECT * FROM guidance_patterns;
-- 3 levels × 5 goals = 15 rows:
--   beginner_strength, beginner_hypertrophy, beginner_endurance, beginner_power, beginner_general,
--   intermediate_strength, intermediate_hypertrophy, ..., intermediate_general,
--   advanced_strength, ..., advanced_general
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | text (PK) | Pattern slug: "beginner_strength", "advanced_hypertrophy", etc. |
| `experience_level` | text | "Beginner" \| "Intermediate" \| "Advanced" |
| `training_goal` | text | "Strength" \| "Hypertrophy" \| "Endurance" \| "Power" \| "General" |
| `recommended_sets` | int | e.g., 3, 4, 5 |
| `recommended_reps_min` | int | e.g., 3, 6, 12 |
| `recommended_reps_max` | int | e.g., 6, 12, 20 |
| `target_rpe` | int | Rate of Perceived Exertion (1-10 scale) |
| `tempo` | text | e.g., "2-0-1" (eccentric-isometric-concentric) or "0-0-X" for explosives |
| `breathing_cue` | text | Exercise-generic breathing instruction |
| `form_cue` | text | Exercise-generic form instruction |

### `exercise_guidance_overrides` (1,218 rows)

Maps each exercise to a pattern with optional exercise-specific customizations.

```sql
SELECT * FROM exercise_guidance_overrides
WHERE exercise_id = 'EX-0001';
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | int (PK) | Auto-increment ID |
| `exercise_id` | text (FK, UNIQUE) | Reference to `source_exercises` |
| `pattern_id` | text (FK) | Reference to `guidance_patterns.id` |
| `regression_tier_1_exercise_id` | text (FK) | Fallback exercise (easier variant) |
| `regression_tier_1_note` | text | Why to regress (e.g., "If form breaks down") |
| `regression_tier_2_exercise_id` | text (FK) | Second fallback |
| `regression_tier_2_note` | text | |
| `regression_tier_3_exercise_id` | text (FK) | Third fallback |
| `regression_tier_3_note` | text | |
| `alternative_1_exercise_id` | text (FK) | Equipment substitute (e.g., dumbbell if barbell unavailable) |
| `alternative_1_note` | text | Rationale |
| `alternative_2_exercise_id` | text (FK) | Second alternative |
| `alternative_2_note` | text | |
| `required_mobility` | text | "ankle" \| "shoulder" \| "hip" \| null (e.g., "shoulder mobility required for OHP") |
| `contraindicated_for` | text | "lower_back_pain" \| "shoulder_impingement" \| null |
| `minimum_experience_level` | text | "Beginner" \| "Intermediate" \| null (e.g., Snatch may require Intermediate) |
| `exercise_specific_form_cue` | text | Overrides pattern form cue (e.g., "Elbows 45°, not flared") |
| `beginner_safety_cue` | text | Safety-specific note for beginners only |

## Querying

### Single Exercise Guidance

```ts
import { getExerciseGuidance } from "@/domain/getExerciseGuidance";

const guidance = await getExerciseGuidance(db, "EX-0001");
// guidance.recommendedSets, guidance.tempo, guidance.regressionTier1ExerciseId, etc.
```

### Bulk Exercise Guidance

```ts
import { getExercisesGuidance } from "@/domain/getExerciseGuidance";

const guidances = await getExercisesGuidance(db, ["EX-0001", "EX-0002", "EX-0003"]);
```

## Maintenance Workflows

### Update a Pattern (affects all exercises using it)

```sql
UPDATE guidance_patterns
SET recommended_sets = 4, target_rpe = 8
WHERE id = 'beginner_strength';
```

All 1,218 exercises using this pattern inherit the change. No data duplication to update.

### Customize a Single Exercise

Example: Squats for beginners should regress to leg press.

```sql
UPDATE exercise_guidance_overrides
SET regression_tier_1_exercise_id = 'EX-0100',
    regression_tier_1_note = 'Safer spinal loading if ROM limited'
WHERE exercise_id = 'EX-0042'; -- Barbell Back Squat
```

### Add a New Exercise

```sql
INSERT INTO exercise_guidance_overrides
(exercise_id, pattern_id)
VALUES ('EX-1999', 'beginner_strength');
-- Exercise inherits all pattern guidance without duplication
```

## Seeding

Run all seeds:

```bash
npm run db:seed:all
```

Or individually:

```bash
npm run db:seed:patterns    # 15 rows
npm run db:seed:overrides   # 1,218 rows
```

## Implementation Details

### Pattern Selection Logic (seed-exercise-guidance-overrides.ts)

Exercises are routed to patterns based on their **derived movement booleans**:

1. **Compound Pushes/Pulls** → `beginner_strength` (horizontalPush, verticalPush, horizontalPull, verticalPull)
2. **Compound Lower Body** → `beginner_strength` (squat, hinge, carry)
3. **Isolation** → `beginner_hypertrophy` (compoundIsolation = "Isolation")
4. **Rotational/Core** → `beginner_general` (rotation, antiRotation, core)
5. **Default** → `beginner_general`

This ensures:
- Strength compounds get conservative sets/reps and heavy RPE
- Isolations get moderate sets and hypertrophy-focused tempo
- Core/mobility gets general-purpose guidance

### Why Two Tables?

**Before (single-table exercise_guidance)**: 1,218 × 3 levels × 5 goals = **18,270 rows** of redundant data.

| exerciseId | experienceLevel | trainingGoal | recommendedSets | recommendedRepsMin | … |
|------------|-----------------|--------------|-----------------|-------------------|---|
| EX-0001 | Beginner | Strength | 3 | 3 | … |
| EX-0001 | Beginner | Hypertrophy | 3 | 6 | … |
| EX-0001 | Beginner | Endurance | 3 | 12 | … |
| EX-0001 | Beginner | Power | 3 | 1 | … |
| EX-0001 | Beginner | General | 3 | 8 | … |
| EX-0001 | Intermediate | Strength | 4 | 3 | … |
| … | … | … | … | … | … |

Updating "beginner strength" guidance required updating 1,218 rows.

**After (two-table pattern + overrides)**: **15 patterns + 1,218 mappings = 1,233 rows**.

| Patterns (15 rows) |
|----|
| beginner_strength: 3 sets, 3-6 reps, RPE 7, "2-0-1" tempo |
| beginner_hypertrophy: 3 sets, 6-12 reps, RPE 6, "2-1-1" tempo |
| … (13 more) |

| Exercise Overrides (1,218 rows) |
|----|
| EX-0001 → beginner_hypertrophy (+ optional overrides) |
| EX-0002 → beginner_strength |
| … (1,216 more) |

Updating "beginner strength" guidance now updates **1 row**, and all exercises using it inherit the change instantly via the FK join.

## Testing

Verify the join works:

```sql
SELECT COUNT(*) FROM guidance_patterns;                    -- 15 rows
SELECT COUNT(*) FROM exercise_guidance_overrides;          -- 1,218 rows
SELECT COUNT(DISTINCT pattern_id) FROM exercise_guidance_overrides;  -- Should be 15
```

Verify no orphaned exercises:

```sql
SELECT COUNT(*) FROM exercise_guidance_overrides o
LEFT JOIN guidance_patterns p ON o.pattern_id = p.id
WHERE p.id IS NULL;  -- Should return 0
```

## Future Enhancements

- **A/B Testing**: Create "beginner_strength_conservative" and "beginner_strength_aggressive" patterns; split users between them
- **Individual Customization**: Override a user's pattern selection (e.g., "This user always uses advanced patterns")
- **Seasonal Periodization**: Patterns by season (off-season vs. peak)
- **Injury-Aware Routing**: Route exercises with lower back strain to "beginner_general" instead of "beginner_strength"
