import { prisma } from "./src/lib/prisma";

async function main() {
  const features = ["OVERVIEW", "LEDGER", "COMMS", "REPORTS", "SERVICES", "ROSTER", "CUSTOMERS", "SETTINGS", "SUPPORT"];
  await prisma.tenant.updateMany({
    data: {
      enabledFeatures: features
    }
  });
  console.log("All shops updated with full features.");
}

main();
