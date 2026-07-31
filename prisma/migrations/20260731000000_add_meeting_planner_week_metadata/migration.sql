ALTER TABLE "MeetingPlanner"
ADD COLUMN IF NOT EXISTS "groupName" TEXT,
ADD COLUMN IF NOT EXISTS "selectedDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "weekEnd" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "weekKey" TEXT,
ADD COLUMN IF NOT EXISTS "year" INTEGER,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';

UPDATE "MeetingPlanner"
SET
  "groupName" = CASE "group"
    WHEN 'navegantes' THEN 'Navegantes'
    WHEN 'pioneros' THEN 'Pioneros'
    WHEN 'seguidores' THEN 'Seguidores'
    WHEN 'exploradores' THEN 'Exploradores'
    WHEN 'general' THEN 'Reunion general'
    ELSE "group"
  END,
  "selectedDate" = COALESCE("selectedDate", "meetingDate"),
  "weekStart" = COALESCE("weekStart", DATE_TRUNC('week', "meetingDate")),
  "weekEnd" = COALESCE(
    "weekEnd",
    DATE_TRUNC('week', "meetingDate") + INTERVAL '6 days'
  ),
  "weekKey" = COALESCE(
    "weekKey",
    TO_CHAR(DATE_TRUNC('week', "meetingDate"), 'YYYY-MM-DD')
  ),
  "year" = COALESCE(
    "year",
    EXTRACT(YEAR FROM DATE_TRUNC('week', "meetingDate"))::INTEGER
  );

CREATE INDEX IF NOT EXISTS "MeetingPlanner_weekKey_idx"
ON "MeetingPlanner"("weekKey");

CREATE INDEX IF NOT EXISTS "MeetingPlanner_group_weekKey_idx"
ON "MeetingPlanner"("group", "weekKey");

CREATE UNIQUE INDEX IF NOT EXISTS "MeetingPlanner_group_weekKey_key"
ON "MeetingPlanner"("group", "weekKey");
