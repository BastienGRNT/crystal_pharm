import { describe, expect, it } from 'vitest';
import {
	assignOverlapLanes,
	computeAgendaHourRange,
	listAgendaHours,
	toAgendaPercent,
	toMinutesSinceMidnight
} from './agenda';

const item = (id: string, startTime: string, endTime: string) => ({ id, startTime, endTime });
const defaultRange = { firstHour: 8, lastHour: 20 };

describe('toMinutesSinceMidnight', () => {
	it('convertit une heure en minutes', () => {
		expect(toMinutesSinceMidnight('08:30')).toBe(510);
	});
});

describe('computeAgendaHourRange', () => {
	it('garde la plage par défaut quand tout y tient', () => {
		expect(computeAgendaHourRange([item('a', '09:00', '09:15')], defaultRange)).toEqual(defaultRange);
	});

	it('s’élargit à l’heure pleine pour un rendez-vous qui dépasse', () => {
		expect(computeAgendaHourRange([item('a', '07:45', '08:00'), item('b', '20:15', '20:30')], defaultRange)).toEqual({
			firstHour: 7,
			lastHour: 21
		});
	});
});

describe('listAgendaHours', () => {
	it('liste chaque heure pleine, bornes comprises', () => {
		expect(listAgendaHours({ firstHour: 8, lastHour: 11 })).toEqual([8, 9, 10, 11]);
	});
});

describe('toAgendaPercent', () => {
	it('place une heure dans la plage', () => {
		expect(toAgendaPercent('14:00', defaultRange)).toBe(50);
	});

	it('reste dans les bornes', () => {
		expect(toAgendaPercent('06:00', defaultRange)).toBe(0);
		expect(toAgendaPercent('23:00', defaultRange)).toBe(100);
	});
});

describe('assignOverlapLanes', () => {
	it('laisse toute la largeur à un rendez-vous seul', () => {
		expect(assignOverlapLanes([item('a', '09:00', '09:30')]).get('a')).toEqual({ laneIndex: 0, laneCount: 1 });
	});

	it('met côte à côte deux rendez-vous qui se chevauchent', () => {
		const lanes = assignOverlapLanes([item('a', '09:00', '09:30'), item('b', '09:15', '09:45')]);
		expect(lanes.get('a')).toEqual({ laneIndex: 0, laneCount: 2 });
		expect(lanes.get('b')).toEqual({ laneIndex: 1, laneCount: 2 });
	});

	it('réutilise un couloir libéré et ne partage pas avec un rendez-vous qui suit sans chevaucher', () => {
		const lanes = assignOverlapLanes([
			item('a', '09:00', '10:00'),
			item('b', '09:00', '09:30'),
			item('c', '09:30', '10:00'),
			item('d', '10:00', '10:15')
		]);
		expect(lanes.get('c')).toEqual({ laneIndex: 1, laneCount: 2 });
		expect(lanes.get('d')).toEqual({ laneIndex: 0, laneCount: 1 });
	});
});
