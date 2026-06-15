ALTER TYPE "UserSex" ADD VALUE IF NOT EXISTS 'UNSPECIFIED';

ALTER TABLE "Joven"
ADD COLUMN "externalSource" TEXT,
ADD COLUMN "externalId" TEXT;

ALTER TABLE "Attendance"
ADD COLUMN "source" TEXT,
ADD COLUMN "externalKey" TEXT;

CREATE UNIQUE INDEX "Joven_externalSource_externalId_key"
ON "Joven"("externalSource", "externalId");

CREATE UNIQUE INDEX "Attendance_externalKey_key"
ON "Attendance"("externalKey");
