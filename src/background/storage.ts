import type { StorageSchema } from "../shared/types";
import { DEFAULT_STORAGE } from "../shared/types";
import {
  DEFAULT_ONDEVICE_MODEL,
  LEGACY_DEFAULT_ONDEVICE_MODEL,
} from "../shared/ondeviceModel";

const STORAGE_KEY = "askwise";
const LEGACY_STORAGE_KEY = "promptpilot";

export async function getStorage(): Promise<StorageSchema> {
  const result = await chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  const data = (result[STORAGE_KEY] ?? result[LEGACY_STORAGE_KEY]) as
    | StorageSchema
    | undefined;

  if (!data) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_STORAGE });
    return DEFAULT_STORAGE;
  }

  const migrated = migrate(data);
  if (!result[STORAGE_KEY] && result[LEGACY_STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: migrated });
    await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
  }
  return migrated;
}

export async function setStorage(data: StorageSchema): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function updateStorage(
  updater: (current: StorageSchema) => StorageSchema
): Promise<StorageSchema> {
  const current = await getStorage();
  const updated = updater(current);
  await setStorage(updated);
  return updated;
}

function migrate(data: StorageSchema): StorageSchema {
  const base = !data.schemaVersion
    ? { ...DEFAULT_STORAGE, ...data, schemaVersion: 1 }
    : data;

  const providers = base.providers ?? DEFAULT_STORAGE.providers;
  const prev = providers.ondevice ?? DEFAULT_STORAGE.providers.ondevice;
  // One-time: users still on the old slow default move to the fast model.
  const model =
    (base.schemaVersion ?? 1) < 2 &&
    prev.model === LEGACY_DEFAULT_ONDEVICE_MODEL
      ? DEFAULT_ONDEVICE_MODEL
      : prev.model;
  const ondevice = {
    ...prev,
    enabled: true,
    model,
  };

  return {
    ...DEFAULT_STORAGE,
    ...base,
    schemaVersion: Math.max(base.schemaVersion ?? 1, 2),
    providers: {
      ondevice,
    },
  };
}
