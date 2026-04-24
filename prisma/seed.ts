import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.SUPABASE_DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.business.upsert({
    where: { slug: "test-business" },
    update: {},
    create: {
      slug: "test-business",
      name: "Test Business",
      primary_color: "#8C9BBA",
      welcome_message: "Connect to free WiFi!",
      terms_text:
        "By connecting, you agree to receive occasional marketing communications. You can unsubscribe at any time.",
      redirect_url: "https://maxmarketingfirm.com",
      ghl_location_id: "test-location-id",
      ghl_tag: "wifi-lead",
      faskey: "test-faskey-replace-in-production",
    },
  });

  await prisma.$disconnect();
  console.log("Seeded: test-business");
}

main();
