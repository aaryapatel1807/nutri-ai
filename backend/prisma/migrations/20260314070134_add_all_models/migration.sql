/*
  Warnings:

  - You are about to drop the column `badgeId` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `earnedAt` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `activity_level` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `calorie_goal` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `diet_type` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `height_cm` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `protein_goal` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `target_weight_kg` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weight_kg` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workout_days` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Gamification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MealLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkoutExercise` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkoutLog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emoji` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rarity` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `xp` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Gamification" DROP CONSTRAINT "Gamification_userId_fkey";

-- DropForeignKey
ALTER TABLE "MealLog" DROP CONSTRAINT "MealLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutExercise" DROP CONSTRAINT "WorkoutExercise_workoutId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutLog" DROP CONSTRAINT "WorkoutLog_userId_fkey";

-- DropIndex
DROP INDEX "Badge_userId_badgeId_key";

-- AlterTable
ALTER TABLE "Badge" DROP COLUMN "badgeId",
DROP COLUMN "earnedAt",
DROP COLUMN "userId",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "emoji" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "rarity" TEXT NOT NULL,
ADD COLUMN     "xp" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activity_level",
DROP COLUMN "age",
DROP COLUMN "calorie_goal",
DROP COLUMN "diet_type",
DROP COLUMN "goal",
DROP COLUMN "height_cm",
DROP COLUMN "passwordHash",
DROP COLUMN "protein_goal",
DROP COLUMN "target_weight_kg",
DROP COLUMN "weight_kg",
DROP COLUMN "workout_days",
ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "bodyFat" DOUBLE PRECISION,
ADD COLUMN     "calorieGoal" INTEGER DEFAULT 2000,
ADD COLUMN     "carbGoal" INTEGER DEFAULT 250,
ADD COLUMN     "dietType" TEXT,
ADD COLUMN     "dob" TEXT,
ADD COLUMN     "fatGoal" INTEGER DEFAULT 65,
ADD COLUMN     "fitnessGoal" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "muscleMass" DOUBLE PRECISION,
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'temp_password',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "proteinGoal" INTEGER DEFAULT 150,
ADD COLUMN     "sleepGoal" DOUBLE PRECISION DEFAULT 8,
ADD COLUMN     "targetWeight" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "waterGoal" DOUBLE PRECISION DEFAULT 2.5,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- DropTable
DROP TABLE "ChatMessage";

-- DropTable
DROP TABLE "Gamification";

-- DropTable
DROP TABLE "MealLog";

-- DropTable
DROP TABLE "WorkoutExercise";

-- DropTable
DROP TABLE "WorkoutLog";

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealType" TEXT NOT NULL DEFAULT 'Breakfast',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "calories" INTEGER NOT NULL,
    "category" TEXT,
    "difficulty" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
