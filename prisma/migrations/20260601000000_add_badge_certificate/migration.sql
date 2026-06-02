CREATE TABLE "BadgeCertificate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userType" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "certificatePath" TEXT NOT NULL,
  "certificateName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BadgeCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BadgeCertificate_userId_userType_badgeId_key" ON "BadgeCertificate"("userId", "userType", "badgeId");
CREATE INDEX "BadgeCertificate_status_idx" ON "BadgeCertificate"("status");
CREATE INDEX "BadgeCertificate_userId_userType_idx" ON "BadgeCertificate"("userId", "userType");
