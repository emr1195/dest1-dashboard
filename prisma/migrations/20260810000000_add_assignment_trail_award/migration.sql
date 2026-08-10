ALTER TABLE "Assignment"
ADD COLUMN IF NOT EXISTS "trailAwardId" TEXT;

ALTER TABLE "Assignment"
ADD COLUMN IF NOT EXISTS "biblicalBook" TEXT;

CREATE INDEX IF NOT EXISTS "Assignment_trailAwardId_idx"
ON "Assignment"("trailAwardId");

UPDATE "Assignment"
SET
  "trailAwardId" = 'seguidores-biblico-01',
  "biblicalBook" = 'Salmos'
WHERE "category" = 'Estudio biblico'
  AND (
    "id" IN (8, 13)
    OR LOWER("title") IN (
      'sanacion divina',
      'sanidad divina',
      'verdad versus mentira',
      'verdad versus mentiras'
    )
  );
