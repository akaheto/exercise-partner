export interface Override {
  field: string;
  value: string;
  profileId: string | null;
}

/**
 * Layers override values onto a source object — the read-time half of the
 * two-layer data principle (see TECHNICAL_SPEC.docx section 2). A `null`
 * profileId override is global and applies to everyone; a profile-specific
 * override for the same field takes precedence over the global one.
 *
 * An override naming a field that doesn't exist on `source` is ignored rather
 * than injected as a new property — overrides can only correct known fields,
 * never introduce arbitrary ones.
 *
 * Pure and side-effect free: does not mutate `source` or `overrides`.
 */
export function mergeOverrides<T extends Record<string, unknown>>(
  source: T,
  overrides: Override[],
  profileId: string | null,
): T {
  const merged = { ...source };
  const applicable = overrides.filter((o) => o.profileId === null || o.profileId === profileId);

  // Global overrides apply first; a profile-specific override for the same
  // field applied afterwards wins.
  const ordered = [
    ...applicable.filter((o) => o.profileId === null),
    ...applicable.filter((o) => o.profileId !== null),
  ];

  for (const override of ordered) {
    if (override.field in merged) {
      (merged as Record<string, unknown>)[override.field] = override.value;
    }
  }

  return merged;
}
