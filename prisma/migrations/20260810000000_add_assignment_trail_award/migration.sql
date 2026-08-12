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

UPDATE "Assignment"
SET "trailAwardId" = SUBSTRING(
  LOWER("title")
  FROM '(101|102|103|104|105|106|201|202|203|204|205|206|301|302|303|304|305|306)'
)
WHERE "category" = 'Premio liderazgo'
  AND "trailAwardId" IS NULL
  AND LOWER("title") ~ '(^|[^0-9])(101|102|103|104|105|106|201|202|203|204|205|206|301|302|303|304|305|306)([^0-9]|$)';
