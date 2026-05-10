"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetting = getSetting;
exports.saveSetting = saveSetting;
exports.getSettingList = getSettingList;
exports.createSettingListItem = createSettingListItem;
exports.updateSettingListItem = updateSettingListItem;
exports.deleteSettingListItem = deleteSettingListItem;
exports.appendActivityLog = appendActivityLog;
const prisma_1 = require("./prisma");
function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
async function getSetting(key, fallback) {
    const row = await prisma_1.prisma.systemSetting.findUnique({ where: { key } });
    if (!row)
        return fallback;
    return row.valueJson;
}
async function saveSetting(key, value) {
    return prisma_1.prisma.systemSetting.upsert({
        where: { key },
        update: { valueJson: value },
        create: { key, valueJson: value },
    });
}
async function getSettingList(key) {
    return getSetting(key, []);
}
async function createSettingListItem(key, payload) {
    const rows = await getSettingList(key);
    const now = new Date().toISOString();
    const item = {
        ...payload,
        id: createId(key),
        createdAt: now,
        updatedAt: now,
    };
    rows.unshift(item);
    await saveSetting(key, rows);
    return item;
}
async function updateSettingListItem(key, id, payload) {
    const rows = await getSettingList(key);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1)
        return null;
    rows[index] = {
        ...rows[index],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
    };
    await saveSetting(key, rows);
    return rows[index];
}
async function deleteSettingListItem(key, id) {
    const rows = await getSettingList(key);
    const nextRows = rows.filter((row) => row.id !== id);
    if (rows.length === nextRows.length)
        return false;
    await saveSetting(key, nextRows);
    return true;
}
async function appendActivityLog(payload) {
    const rows = await getSetting("activity_log", []);
    rows.unshift({
        id: createId("activity"),
        ...payload,
        createdAt: new Date().toISOString(),
    });
    await saveSetting("activity_log", rows.slice(0, 500));
}
//# sourceMappingURL=system-settings.js.map