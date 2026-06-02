CREATE TABLE "Evaluation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userType" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "aspectScores" JSONB,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Evaluation_userId_userType_idx" ON "Evaluation"("userId", "userType");
CREATE INDEX "Evaluation_createdBy_idx" ON "Evaluation"("createdBy");
