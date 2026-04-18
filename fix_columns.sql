-- Add lineup, rundown, venue map fields
ALTER TABLE events ADD COLUMN IF NOT EXISTS lineup TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rundown TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_map_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_latitude TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_longitude TEXT;