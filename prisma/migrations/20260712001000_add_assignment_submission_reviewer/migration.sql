ALTER TABLE "AssignmentSubmission" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "AssignmentSubmission" ADD COLUMN "reviewedByName" TEXT;
ALTER TABLE "AssignmentSubmission" ADD COLUMN "reviewedByRole" TEXT;
ALTER TABLE "AssignmentSubmission" ADD COLUMN "reviewedAt" TIMESTAMP(3);
