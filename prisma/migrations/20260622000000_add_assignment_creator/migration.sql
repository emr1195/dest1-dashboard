-- Add the real creator of an assignment so group ownership and author display can differ.
ALTER TABLE "Assignment" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "createdByName" TEXT;

CREATE INDEX "Assignment_createdById_idx" ON "Assignment"("createdById");
