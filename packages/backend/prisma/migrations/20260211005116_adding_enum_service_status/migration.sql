/*
  Warnings:

  - The `service_status` column on the `ServiceOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ServiceOrder" DROP COLUMN "service_status",
ADD COLUMN     "service_status" "ServiceStatus" NOT NULL DEFAULT 'PENDING';
