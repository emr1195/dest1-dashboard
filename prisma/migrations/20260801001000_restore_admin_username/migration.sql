-- Restore the column expected by the Prisma Admin model and authentication flows.
ALTER TABLE "Admin"
ADD COLUMN IF NOT EXISTS "username" TEXT;

UPDATE "Admin" AS admin
SET "username" = COALESCE(
  (
    SELECT auth_user."email"
    FROM "AuthUser" AS auth_user
    WHERE auth_user."id" = admin."id"
  ),
  'admin-' || LEFT(admin."id", 8)
)
WHERE admin."username" IS NULL OR BTRIM(admin."username") = '';

ALTER TABLE "Admin"
ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key"
ON "Admin"("username");
