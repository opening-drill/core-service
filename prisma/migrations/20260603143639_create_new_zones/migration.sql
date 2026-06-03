/*
  Warnings:

  - You are about to drop the column `state_duration` on the `polygon` table. All the data in the column will be lost.
  - Added the required column `expiry_date` to the `polygon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Zone" ADD VALUE 'GAZA_CENTER';
ALTER TYPE "Zone" ADD VALUE 'BEER_SHEVA';
ALTER TYPE "Zone" ADD VALUE 'TEL_AVIV';
ALTER TYPE "Zone" ADD VALUE 'TZRIFIN';
ALTER TYPE "Zone" ADD VALUE 'SYRIA';
ALTER TYPE "Zone" ADD VALUE 'IRAQ';
ALTER TYPE "Zone" ADD VALUE 'YEMEN';
ALTER TYPE "Zone" ADD VALUE 'JORDAN';
ALTER TYPE "Zone" ADD VALUE 'EGYPT';
ALTER TYPE "Zone" ADD VALUE 'IRAN';
ALTER TYPE "Zone" ADD VALUE 'LEBANON_SOUTH';
ALTER TYPE "Zone" ADD VALUE 'LEBANON_NORTH';

-- AlterTable
ALTER TABLE "polygon" DROP COLUMN "state_duration",
ADD COLUMN     "expiry_date" TIMESTAMP(3) NOT NULL;
