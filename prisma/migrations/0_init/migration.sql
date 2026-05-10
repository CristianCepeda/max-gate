-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#000000',
    "secondary_color" TEXT NOT NULL DEFAULT '#ffffff',
    "welcome_message" TEXT NOT NULL DEFAULT '',
    "terms_text" TEXT,
    "redirect_url" TEXT,
    "ghl_location_id" TEXT NOT NULL,
    "ghl_tag" TEXT NOT NULL DEFAULT '',
    "ghl_workflow_id" TEXT,
    "router_mac" TEXT,
    "faskey" TEXT NOT NULL,
    "session_timeout" INTEGER NOT NULL DEFAULT 3600,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

