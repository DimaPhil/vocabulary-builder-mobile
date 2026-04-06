import { storage } from "@/lib/storage/mmkv";

export function createMmkvStorage<T>() {
  return {
    getItem: (key: string, initialValue: T) => {
      const raw = storage.getString(key);

      if (!raw) {
        return initialValue;
      }

      return JSON.parse(raw) as T;
    },
    setItem: (key: string, value: T) => {
      storage.set(key, JSON.stringify(value));
    },
    removeItem: (key: string) => {
      storage.remove(key);
    },
  };
}

export const mmkvStorage = createMmkvStorage<unknown>();
