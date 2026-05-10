import { Prisma } from "@prisma/client";
export interface StoredItem {
    id: string;
    name?: string;
    code?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}
export declare function getSetting<T>(key: string, fallback: T): Promise<T>;
export declare function saveSetting(key: string, value: unknown): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    key: string;
    valueJson: Prisma.JsonValue;
}>;
export declare function getSettingList<T extends StoredItem>(key: string): Promise<T[]>;
export declare function createSettingListItem<T extends StoredItem>(key: string, payload: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
export declare function updateSettingListItem<T extends StoredItem>(key: string, id: string, payload: Partial<T>): Promise<T | null>;
export declare function deleteSettingListItem<T extends StoredItem>(key: string, id: string): Promise<boolean>;
export declare function appendActivityLog(payload: {
    action: string;
    module: string;
    message: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    metadata?: Record<string, unknown>;
}): Promise<void>;
//# sourceMappingURL=system-settings.d.ts.map