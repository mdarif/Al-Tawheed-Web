import type { Catalog, DailyBenefit } from './catalog';

/** Same epoch as Flutter home screen: `DateTime(2026)`. */
const BENEFIT_EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();

export function benefitDayIndex(at = Date.now()): number {
  return Math.floor((at - BENEFIT_EPOCH_MS) / 86_400_000);
}

export function getTodaysBenefit(catalog: Catalog, at = Date.now()): DailyBenefit | null {
  const benefits = catalog.dailyBenefits;
  if (!benefits?.length) return null;
  return benefits[benefitDayIndex(at) % benefits.length];
}
