CREATE TABLE IF NOT EXISTS "MeetingPlanner" (
  "id" TEXT NOT NULL,
  "group" TEXT NOT NULL,
  "meetingDate" TIMESTAMP(3) NOT NULL,
  "items" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MeetingPlanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MeetingPlanner_group_idx" ON "MeetingPlanner"("group");
CREATE INDEX IF NOT EXISTS "MeetingPlanner_createdById_idx" ON "MeetingPlanner"("createdById");
CREATE INDEX IF NOT EXISTS "MeetingPlanner_meetingDate_idx" ON "MeetingPlanner"("meetingDate");
