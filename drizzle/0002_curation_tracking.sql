-- Curation tracking: monitor content population progress
create table curation_status (
  exercise_id text primary key references source_exercises(exercise_id) on delete cascade,

  -- Instructions curation
  instructions_status text not null default 'not_started', -- not_started | fetching | fetch_failed | needs_review | approved
  instructions_source text, -- 'muscleandstrength_scraped' | 'manual' | 'ai_generated' | etc.
  instructions_fetched_at timestamp with time zone,
  instructions_fetch_error text,

  -- Starting position curation
  starting_position_status text not null default 'not_started',
  starting_position_source text,
  starting_position_fetched_at timestamp with time zone,
  starting_position_fetch_error text,

  -- Metadata
  notes text,
  last_attempted_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

create index idx_curation_instructions_status on curation_status(instructions_status);
create index idx_curation_starting_position_status on curation_status(starting_position_status);
