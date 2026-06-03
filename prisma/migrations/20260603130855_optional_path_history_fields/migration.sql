-- AlterTable
ALTER TABLE "aircraft_path_history" ALTER COLUMN "altitude" DROP NOT NULL,
ALTER COLUMN "horizontal_speed_mps" DROP NOT NULL,
ALTER COLUMN "vertical_speed_mps" DROP NOT NULL,
ALTER COLUMN "heading_degrees" DROP NOT NULL,
ALTER COLUMN "position_accuracy_m" DROP NOT NULL;
