"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVoucherPrefix = getVoucherPrefix;
exports.generateVoucherNo = generateVoucherNo;
const prisma_1 = require("./prisma");
const voucherPrefixes = {
    PAYMENT: "PV",
    RECEIPT: "RV",
    JOURNAL: "JV",
    CONTRA: "CV",
    ADJUSTMENT: "AV",
};
function getVoucherPrefix(type) {
    return voucherPrefixes[type] ?? "V";
}
async function generateVoucherNo(type) {
    const prefix = getVoucherPrefix(type);
    const existing = await prisma_1.prisma.voucher.findMany({
        where: { voucherNo: { startsWith: `${prefix}-` } },
        select: { voucherNo: true },
    });
    const max = existing.reduce((highest, item) => {
        const match = item.voucherNo.match(new RegExp(`^${prefix}-(\\d+)$`));
        return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
//# sourceMappingURL=voucher-number.js.map