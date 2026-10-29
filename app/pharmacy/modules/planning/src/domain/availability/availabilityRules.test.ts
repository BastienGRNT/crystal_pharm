import { describe, expect, it } from 'vitest';
import { decideInitialStatus, describeAvailabilityRule, findBlockingRule, getWeekdayIndexOfDate, type AvailabilityRule } from './availabilityRules';

const mondayCourse: AvailabilityRule = {
	id: 'rule-1',
	employeeId: 'emma',
	kind: 'course',
	weekday: 0,
	date: undefined,
	startTime: '08:00',
	endTime: '12:00',
	status: 'approved',
	note: ''
};

describe('getWeekdayIndexOfDate', () => {
	it('compte depuis le lundi', () => {
		expect(getWeekdayIndexOfDate('2026-10-26')).toBe(0);
		expect(getWeekdayIndexOfDate('2026-11-01')).toBe(6);
	});
});

describe('findBlockingRule', () => {
	it('bloque un créneau qui chevauche une règle validée de ce jour de la semaine', () => {
		expect(findBlockingRule([mondayCourse], 'emma', '2026-10-26', '11:00', '14:00')).toBe(mondayCourse);
	});

	it('laisse passer un autre jour, un autre employé ou un créneau qui commence à la fin de la règle', () => {
		expect(findBlockingRule([mondayCourse], 'emma', '2026-10-27', '09:00', '12:00')).toBeUndefined();
		expect(findBlockingRule([mondayCourse], 'thomas', '2026-10-26', '09:00', '12:00')).toBeUndefined();
		expect(findBlockingRule([mondayCourse], 'emma', '2026-10-26', '12:00', '15:00')).toBeUndefined();
	});

	it('ignore les règles en attente, refusées ou de simple disponibilité', () => {
		const ignoredRules: AvailabilityRule[] = [
			{ ...mondayCourse, status: 'pending' },
			{ ...mondayCourse, status: 'declined' },
			{ ...mondayCourse, kind: 'available' }
		];
		expect(findBlockingRule(ignoredRules, 'emma', '2026-10-26', '09:00', '11:00')).toBeUndefined();
	});

	it('applique une règle d’un jour précis seulement ce jour-là', () => {
		const oneDayRule: AvailabilityRule = { ...mondayCourse, kind: 'unavailable', weekday: undefined, date: '2026-10-28' };
		expect(findBlockingRule([oneDayRule], 'emma', '2026-10-28', '09:00', '10:00')).toBe(oneDayRule);
		expect(findBlockingRule([oneDayRule], 'emma', '2026-11-04', '09:00', '10:00')).toBeUndefined();
	});
});

describe('decideInitialStatus', () => {
	it('valide tout de suite pour un titulaire ou une validation automatique', () => {
		expect(decideInitialStatus('manual', true)).toBe('approved');
		expect(decideInitialStatus('automatic', false)).toBe('approved');
	});

	it('met en attente la demande d’un employé en validation manuelle', () => {
		expect(decideInitialStatus('manual', false)).toBe('pending');
	});
});

describe('describeAvailabilityRule', () => {
	it('se lit comme une phrase', () => {
		expect(describeAvailabilityRule(mondayCourse)).toBe('Cours tous les lundis, de 08:00 à 12:00');
	});
});
