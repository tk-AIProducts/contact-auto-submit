export const MISSING_FIELD_PLACEHOLDER = '◯◯◯';

/**
 * Normalize入力値をトリムし、空または未定義なら `◯◯◯` を差し込む。
 */
export function normalizeWithPlaceholder(value?: string | null): string {
  if (value === undefined || value === null) {
    return MISSING_FIELD_PLACEHOLDER;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : MISSING_FIELD_PLACEHOLDER;
}

/**
 * 値がプレースホルダー扱いかを判定する。
 */
export function isPlaceholderValue(value?: string | null): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed === MISSING_FIELD_PLACEHOLDER;
}

/**
 * プレースホルダーや空値の場合にフォールバックへ置き換える。
 */
export function resolvePlaceholder(
  value?: string | null,
  fallback = ''
): string {
  return isPlaceholderValue(value) ? fallback : value!.trim();
}

