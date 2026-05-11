-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "last_seen_at" TIMESTAMPTZ(6),
ADD COLUMN     "owner_id" UUID,
ADD COLUMN     "total_connections" INTEGER NOT NULL DEFAULT 0;
