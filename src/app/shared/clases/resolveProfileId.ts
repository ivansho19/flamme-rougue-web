export function resolveProfileId(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return resolveProfileId(value[0]);
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return resolveProfileId(
      record['_id'] ?? record['id'] ?? record['profileId'] ?? ''
    );
  }

  return '';
}
