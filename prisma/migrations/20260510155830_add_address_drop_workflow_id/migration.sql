/*
  Warnings:

  - You are about to drop the column `ghl_workflow_id` on the `businesses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "ghl_workflow_id",
ADD COLUMN     "address" TEXT;
