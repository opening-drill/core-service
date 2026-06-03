/*
  Warnings:

  - The values [BROKEN] on the enum `AircraftStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `altitude` on the `aircraft_path_history` table. All the data in the column will be lost.
  - You are about to drop the column `heading_degrees` on the `aircraft_path_history` table. All the data in the column will be lost.
  - You are about to drop the column `horizontal_speed_mps` on the `aircraft_path_history` table. All the data in the column will be lost.
  - You are about to drop the column `position_accuracy_m` on the `aircraft_path_history` table. All the data in the column will be lost.
  - You are about to drop the column `vertical_speed_mps` on the `aircraft_path_history` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AircraftStatus_new" AS ENUM ('BUSY', 'FREE');
ALTER TABLE "aircraft" ALTER COLUMN "status" TYPE "AircraftStatus_new" USING ("status"::text::"AircraftStatus_new");
ALTER TYPE "AircraftStatus" RENAME TO "AircraftStatus_old";
ALTER TYPE "AircraftStatus_new" RENAME TO "AircraftStatus";
DROP TYPE "public"."AircraftStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "aircraft_path_history" DROP COLUMN "altitude",
DROP COLUMN "heading_degrees",
DROP COLUMN "horizontal_speed_mps",
DROP COLUMN "position_accuracy_m",
DROP COLUMN "vertical_speed_mps";
