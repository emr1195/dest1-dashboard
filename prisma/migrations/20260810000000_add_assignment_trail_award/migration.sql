ALTER TABLE "Assignment"
ADD COLUMN IF NOT EXISTS "trailAwardId" TEXT;

CREATE INDEX IF NOT EXISTS "Assignment_trailAwardId_idx"
ON "Assignment"("trailAwardId");

UPDATE "Assignment"
SET "trailAwardId" = 'seguidores-biblico-01'
WHERE "category" = 'Estudio biblico'
  AND LOWER("title") IN (
    'sanacion divina',
    'sanidad divina',
    'verdad versus mentira',
    'verdad versus mentiras'
  );
