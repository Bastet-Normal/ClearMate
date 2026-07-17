const SENSITIVE_STORAGE_KEY_LIST = [
  "cm_token",
  "cm_api_token",
  "cm_custom_gemini_key",
  "cm_gemini_oauth_token",
  "cm_users_with_pw",
] as const;

const PORTABLE_STORAGE_KEYS = new Set([
  "cm_tasks",
  "cm_analyses",
  "cm_files",
  "cm_user_profile",
  "cm_self_check_results",
  "cm_theme",
  "cm_elder_mode",
]);

const SENSITIVE_STORAGE_KEYS = new Set<string>(SENSITIVE_STORAGE_KEY_LIST);

const PRESERVED_PREFERENCE_KEYS = new Set([
  "cm_theme",
  "cm_elder_mode",
]);

export function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getClearMateStorageKeys(options?: { includeSensitive?: boolean }): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("cm_")) continue;
      if (!options?.includeSensitive && SENSITIVE_STORAGE_KEYS.has(key)) continue;
      keys.push(key);
    }
  } catch {
    return [];
  }
  return keys.sort();
}

export function exportClearMateData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const key of getClearMateStorageKeys()) {
    if (!PORTABLE_STORAGE_KEYS.has(key)) continue;
    const value = safeGetItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
}

export function importClearMateData(parsed: unknown): number {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("格式无效，备份文件必须是 JSON 对象");
  }

  let count = 0;
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!PORTABLE_STORAGE_KEYS.has(key)) continue;
    if (typeof value !== "string") continue;
    if (safeSetItem(key, value)) count += 1;
  }

  if (count === 0) throw new Error("文件中未包含可导入的 ClearMate 数据");

  return count;
}

export function clearClearMateData(options?: { keepPreferences?: boolean }) {
  for (const key of getClearMateStorageKeys({ includeSensitive: true })) {
    if (options?.keepPreferences && PRESERVED_PREFERENCE_KEYS.has(key)) continue;
    safeRemoveItem(key);
  }
}

export function clearLegacySensitiveData() {
  for (const key of SENSITIVE_STORAGE_KEY_LIST) safeRemoveItem(key);
}
