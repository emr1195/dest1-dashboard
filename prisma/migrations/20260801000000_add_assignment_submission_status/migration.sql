ALTER TABLE "AssignmentSubmission"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'submitted';

UPDATE "AssignmentSubmission"
SET "status" = 'reviewed'
WHERE "reviewedAt" IS NOT NULL;

CREATE INDEX "AssignmentSubmission_status_idx"
ON "AssignmentSubmission"("status");
