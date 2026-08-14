UPDATE "Assignment"
SET
  "category" = 'Reto espiritual',
  "biblicalBook" = NULL
WHERE
  "category" = 'Estudio biblico'
  AND "trailAwardId" LIKE 'exploradores-biblico-%';
