import type { OpeningHoursSectionData } from '@crystal-pharm/schema';
import { describe, expect, it } from 'vitest';
import { computePageCacheExpiry, maximumPageAgeMilliseconds } from './pageCacheExpiry';

const closedAllWeek: OpeningHoursSectionData['weeklySchedule'] = {
  monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
};
const farFuture = new Date('2100-01-01T00:00:00Z');

describe('computePageCacheExpiry', () => {
  it('plafonne à une heure quand rien d’autre ne change', () => {
    const now = new Date('2026-10-28T10:00:00Z');
    expect(computePageCacheExpiry({ now, siteAccessEndsAt: farFuture, weeklyOpeningSchedule: closedAllWeek })).toEqual(new Date(now.getTime() + maximumPageAgeMilliseconds));
  });

  it('s’arrête à la fin de l’accès au Tool site, si elle vient avant', () => {
    const now = new Date('2026-10-28T10:00:00Z');
    const siteAccessEndsAt = new Date('2026-10-28T10:20:00Z');
    expect(computePageCacheExpiry({ now, siteAccessEndsAt, weeklyOpeningSchedule: undefined })).toEqual(siteAccessEndsAt);
  });

  it('s’arrête à la prochaine fermeture, en heure de Paris (été, UTC+2)', () => {
    const now = new Date('2026-10-14T11:40:00Z');
    const weeklyOpeningSchedule = { ...closedAllWeek, wednesday: [{ opensAt: '09:00', closesAt: '14:00' }] };
    expect(computePageCacheExpiry({ now, siteAccessEndsAt: farFuture, weeklyOpeningSchedule })).toEqual(new Date('2026-10-14T12:00:00Z'));
  });

  it('s’arrête à la prochaine ouverture, en heure de Paris (hiver, UTC+1)', () => {
    const now = new Date('2026-12-09T07:40:00Z');
    const weeklyOpeningSchedule = { ...closedAllWeek, wednesday: [{ opensAt: '09:00', closesAt: '19:00' }] };
    expect(computePageCacheExpiry({ now, siteAccessEndsAt: farFuture, weeklyOpeningSchedule })).toEqual(new Date('2026-12-09T08:00:00Z'));
  });

  it('s’arrête à minuit à Paris : le jour affiché change', () => {
    const now = new Date('2026-12-09T22:30:00Z');
    expect(computePageCacheExpiry({ now, siteAccessEndsAt: farFuture, weeklyOpeningSchedule: closedAllWeek })).toEqual(new Date('2026-12-09T23:00:00Z'));
  });

  it('suit le changement d’heure : minuit tombe en UTC+2 la veille du passage à l’heure d’hiver', () => {
    const now = new Date('2026-10-24T21:40:00Z');
    expect(computePageCacheExpiry({ now, siteAccessEndsAt: farFuture, weeklyOpeningSchedule: undefined })).toEqual(new Date('2026-10-24T22:00:00Z'));
  });

  it('ne s’arrête pas sur un horaire déjà passé', () => {
    const now = new Date('2026-10-14T15:00:00Z');
    const weeklyOpeningSchedule = { ...closedAllWeek, wednesday: [{ opensAt: '09:00', closesAt: '14:00' }] };
    expect(computePageCacheExpiry({ now, siteAccessEndsAt: farFuture, weeklyOpeningSchedule })).toEqual(new Date(now.getTime() + maximumPageAgeMilliseconds));
  });
});
