import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface StoredItem {
  id: string;
  name?: string;
  code?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.valueJson as T;
}

export async function saveSetting(key: string, value: unknown) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { valueJson: value as Prisma.InputJsonValue },
    create: { key, valueJson: value as Prisma.InputJsonValue },
  });
}

export async function getSettingList<T extends StoredItem>(key: string) {
  return getSetting<T[]>(key, []);
}

export async function createSettingListItem<T extends StoredItem>(
  key: string,
  payload: Omit<T, "id" | "createdAt" | "updatedAt">
) {
  const rows = await getSettingList<T>(key);
  const now = new Date().toISOString();
  const item = {
    ...payload,
    id: createId(key),
    createdAt: now,
    updatedAt: now,
  } as T;
  rows.unshift(item);
  await saveSetting(key, rows);
  return item;
}

export async function updateSettingListItem<T extends StoredItem>(
  key: string,
  id: string,
  payload: Partial<T>
) {
  const rows = await getSettingList<T>(key);
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  rows[index] = {
    ...rows[index],
    ...payload,
    id,
    updatedAt: new Date().toISOString(),
  };
  await saveSetting(key, rows);
  return rows[index];
}

export async function deleteSettingListItem<T extends StoredItem>(key: string, id: string) {
  const rows = await getSettingList<T>(key);
  const nextRows = rows.filter((row) => row.id !== id);
  if (rows.length === nextRows.length) return false;
  await saveSetting(key, nextRows);
  return true;
}

export async function appendActivityLog(payload: {
  action: string;
  module: string;
  message: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
}) {
  const rows = await getSetting<Array<Record<string, unknown>>>("activity_log", []);
  rows.unshift({
    id: createId("activity"),
    ...payload,
    createdAt: new Date().toISOString(),
  });
  await saveSetting("activity_log", rows.slice(0, 500));
}
