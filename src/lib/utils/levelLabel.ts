const LEVEL_KEYS: Record<string, string> = {
  beginner: 'common.levelBeginner',
  intermediate: 'common.levelIntermediate',
  advanced: 'common.levelAdvanced',
  all: 'common.levelAll',
};

export function getLevelLabel(level: string | null | undefined, t: (key: string) => string): string {
  if (!level?.trim()) return '';
  const key = LEVEL_KEYS[level.toLowerCase()];
  return key ? t(key) : level;
}
