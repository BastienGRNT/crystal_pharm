import { describe, expect, it } from 'vitest';
import { moveSpan, resizeSpan, snapToQuarterHour, spanBetween } from './shiftDragging';

const range = { startMinutes: 480, endMinutes: 1200 };
const morning = { startMinutes: 540, endMinutes: 750 };

describe('snapToQuarterHour', () => {
	it('aimante au quart d’heure le plus proche', () => {
		expect(snapToQuarterHour(547)).toBe(540);
		expect(snapToQuarterHour(553)).toBe(555);
	});
});

describe('moveSpan', () => {
	it('garde la durée en déplaçant le créneau', () => {
		expect(moveSpan(morning, 62, range)).toEqual({ startMinutes: 600, endMinutes: 810 });
	});

	it('reste dans l’axe affiché', () => {
		expect(moveSpan(morning, -500, range)).toEqual({ startMinutes: 480, endMinutes: 690 });
		expect(moveSpan(morning, 900, range)).toEqual({ startMinutes: 990, endMinutes: 1200 });
	});
});

describe('resizeSpan', () => {
	it('déplace seulement le bord tiré', () => {
		expect(resizeSpan(morning, 'end', 30, range)).toEqual({ startMinutes: 540, endMinutes: 780 });
		expect(resizeSpan(morning, 'start', -30, range)).toEqual({ startMinutes: 510, endMinutes: 750 });
	});

	it('garde une durée minimale', () => {
		expect(resizeSpan(morning, 'end', -400, range)).toEqual({ startMinutes: 540, endMinutes: 570 });
		expect(resizeSpan(morning, 'start', 400, range)).toEqual({ startMinutes: 720, endMinutes: 750 });
	});
});

describe('spanBetween', () => {
	it('ordonne les deux points, dans les deux sens', () => {
		expect(spanBetween(600, 720, range)).toEqual({ startMinutes: 600, endMinutes: 720 });
		expect(spanBetween(720, 600, range)).toEqual({ startMinutes: 600, endMinutes: 720 });
	});
});
