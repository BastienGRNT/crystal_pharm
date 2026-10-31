import { describe, expect, it } from 'vitest';
import { assignLanes } from './lanes';

describe('assignLanes', () => {
	it('met côte à côte les plages qui se croisent', () => {
		const { laneByKey, laneCount } = assignLanes([
			{ key: 'a', startMinutes: 510, endMinutes: 1170 },
			{ key: 'b', startMinutes: 720, endMinutes: 1200 }
		]);
		expect(laneCount).toBe(2);
		expect(laneByKey.get('a')).not.toBe(laneByKey.get('b'));
	});

	it('fait partager une voie à deux plages qui ne se croisent pas', () => {
		const { laneByKey, laneCount } = assignLanes([
			{ key: 'soir', startMinutes: 840, endMinutes: 1200 },
			{ key: 'matin', startMinutes: 510, endMinutes: 750 }
		]);
		expect(laneCount).toBe(1);
		expect(laneByKey.get('matin')).toBe(0);
		expect(laneByKey.get('soir')).toBe(0);
	});

	it('garde au moins une voie pour une journée vide', () => {
		expect(assignLanes([]).laneCount).toBe(1);
	});
});
