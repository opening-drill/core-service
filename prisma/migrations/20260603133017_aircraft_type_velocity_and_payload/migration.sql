/*
  Warnings:

  - Added the required column `payload_kg` to the `aircraft_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `velocity_kmh` to the `aircraft_type` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "aircraft_type" ADD COLUMN     "payload_kg" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "velocity_kmh" DOUBLE PRECISION NOT NULL;
