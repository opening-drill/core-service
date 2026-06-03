/*
  Warnings:

  - The values [BEER_SHEVA,TEL_AVIV,TZRIFIN,SYRIA,IRAQ,YEMEN,JORDAN,EGYPT,IRAN,LEBANON_SOUTH,LEBANON_NORTH] on the enum `Zone` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Zone_new" AS ENUM ('GAZA_SOUTH', 'GAZA_CENTER', 'GAZA_NORTH', 'ISRAEL_NORTH', 'ISRAEL_CENTER', 'ISRAEL_SOUTH');
ALTER TABLE "polygon" ALTER COLUMN "zone" TYPE "Zone_new" USING ("zone"::text::"Zone_new");
ALTER TYPE "Zone" RENAME TO "Zone_old";
ALTER TYPE "Zone_new" RENAME TO "Zone";
DROP TYPE "public"."Zone_old";
COMMIT;
