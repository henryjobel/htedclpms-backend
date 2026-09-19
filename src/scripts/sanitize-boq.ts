import { prisma } from "../lib/prisma";

async function main() {
  const items = await prisma.bOQItem.findMany();
  console.log("Current BOQ Items count:", items.length);
  for (const item of items) {
    const est = item.quantity * item.unitRate;
    const mat = item.materialCost || 0;
    const lab = item.laborCost || 0;
    const correctTotal = (mat + lab > 0) ? (mat + lab) : est;
    if (Math.abs(item.totalCost - correctTotal) > 0.01) {
      console.log("Fixing item:", item.description, "old:", item.totalCost, "new:", correctTotal);
      await prisma.bOQItem.update({
        where: { id: item.id },
        data: { totalCost: correctTotal }
      });
    }
  }
  console.log("All BOQ items sanitized successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
