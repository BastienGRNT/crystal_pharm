import { describe, expect, it } from 'vitest';
import { formatNoticeAge } from './noticeAge';

const now = new Date('2026-10-31T12:00:00Z');
const minutesBefore = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);

describe('formatNoticeAge', () => {
	it('dit l’âge comme on le dirait', () => {
		expect(formatNoticeAge(minutesBefore(0), now)).toBe('à l’instant');
		expect(formatNoticeAge(minutesBefore(5), now)).toBe('il y a 5 min');
		expect(formatNoticeAge(minutesBefore(3 * 60), now)).toBe('il y a 3 h');
		expect(formatNoticeAge(minutesBefore(30 * 60), now)).toBe('hier');
		expect(formatNoticeAge(new Date('2026-10-12T09:00:00Z'), now)).toBe('le 12 octobre');
	});
});
