import { prisma } from "./prisma";

const voucherPrefixes: Record<string, string> = {
  PAYMENT: "PV",
  RECEIPT: "RV",
  JOURNAL: "JV",
  CONTRA: "CV",
  ADJUSTMENT: "AV",
};

export function getVoucherPrefix(type: string) {
  return voucherPrefixes[type] ?? "V";
}

export async function generateVoucherNo(type: string) {
  const prefix = getVoucherPrefix(type);
  const existing = await prisma.voucher.findMany({
    where: { voucherNo: { startsWith: `${prefix}-` } },
    select: { voucherNo: true },
  });

  const max = existing.reduce((highest, item) => {
    const match = item.voucherNo.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
