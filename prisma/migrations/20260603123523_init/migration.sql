-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('EDIT', 'VIEW');

-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('GAZA_SOUTH', 'GAZA_NORTH');

-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('DESTROYED', 'STANDING');

-- CreateEnum
CREATE TYPE "AircraftStatus" AS ENUM ('BUSY', 'FREE', 'BROKEN');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "permission" "PermissionType" NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "permission_pkey" PRIMARY KEY ("permission")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" SERIAL NOT NULL,
    "role_id" UUID NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picture" (
    "id" UUID NOT NULL,
    "s3_object_id" TEXT NOT NULL,
    "s3_bucket_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "picture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polygon" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "geojson" JSONB NOT NULL,
    "zone" "Zone" NOT NULL,
    "state_duration" INTEGER NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "polygon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "status" "TargetStatus" NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "aircraft_id" UUID,
    "picture_id" UUID NOT NULL,
    "ai_recommendation_id" UUID,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aircraft_type" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_date" TIMESTAMP(3),

    CONSTRAINT "aircraft_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aircraft" (
    "id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "status" "AircraftStatus" NOT NULL,
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aircraft_path_history" (
    "id" SERIAL NOT NULL,
    "aircraft_id" UUID NOT NULL,
    "location" JSONB NOT NULL,
    "altitude" INTEGER NOT NULL,
    "horizontal_speed_mps" DOUBLE PRECISION NOT NULL,
    "vertical_speed_mps" DOUBLE PRECISION NOT NULL,
    "heading_degrees" DOUBLE PRECISION NOT NULL,
    "position_accuracy_m" DOUBLE PRECISION NOT NULL,
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aircraft_path_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis" (
    "id" UUID NOT NULL,
    "raw_result" TEXT NOT NULL,
    "picture_id" UUID NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendation" (
    "id" UUID NOT NULL,
    "raw_recommendation" TEXT NOT NULL,
    "recommended_aircraft_id" UUID NOT NULL,
    "urgency_level" DOUBLE PRECISION NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "event_ai_recommendation_id_key" ON "event"("ai_recommendation_id");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_fkey" FOREIGN KEY ("permission") REFERENCES "permission"("permission") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "target"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_aircraft_id_fkey" FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_picture_id_fkey" FOREIGN KEY ("picture_id") REFERENCES "picture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_ai_recommendation_id_fkey" FOREIGN KEY ("ai_recommendation_id") REFERENCES "ai_recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "aircraft_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aircraft_path_history" ADD CONSTRAINT "aircraft_path_history_aircraft_id_fkey" FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_picture_id_fkey" FOREIGN KEY ("picture_id") REFERENCES "picture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation" ADD CONSTRAINT "ai_recommendation_recommended_aircraft_id_fkey" FOREIGN KEY ("recommended_aircraft_id") REFERENCES "aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
