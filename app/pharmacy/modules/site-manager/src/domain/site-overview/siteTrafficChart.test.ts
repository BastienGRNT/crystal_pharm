import { describe, expect, it } from 'vitest';
import {
	describeBusiestSlot,
	describeVisitCount,
	findShownHourRange,
	toBusynessRows,
	toDailyVisitColumns,
	toHourColumnLabels
} from './siteTrafficChart';

function emptyBusynessGrid(): number[][] {
	return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
}

function listDays(firstDay: string, dayCount: number): { day: string; viewCount: number; visitCount: number }[] {
	return Array.from({ length: dayCount }, (_, index) => {
		const day = new Date(`${firstDay}T12:00:00Z`);
		day.setUTCDate(day.getUTCDate() + index);
		return { day: day.toISOString().slice(0, 10), viewCount: index * 2, visitCount: index };
	});
}

describe('describeVisitCount', () => {
	it('says when there was no visit', () => {
		expect(describeVisitCount(0)).toBe('Aucune visite');
	});

	it('agrees the noun with the count', () => {
		expect(describeVisitCount(1)).toBe('1 visite');
		expect(describeVisitCount(12)).toBe('12 visites');
	});
});

describe('toDailyVisitColumns', () => {
	it('emphasizes only the last seven days', () => {
		const columns = toDailyVisitColumns(listDays('2026-10-05', 28));

		expect(columns.filter((column) => column.isEmphasized).map((column) => column.key)).toEqual([
			'2026-10-26',
			'2026-10-27',
			'2026-10-28',
			'2026-10-29',
			'2026-10-30',
			'2026-10-31',
			'2026-11-01'
		]);
	});

	it('writes a date under each Monday only', () => {
		const columns = toDailyVisitColumns(listDays('2026-10-25', 3));

		expect(columns.map((column) => column.axisLabel)).toEqual([undefined, '26 oct.', undefined]);
	});

	it('names each day in full for the tooltip', () => {
		const [column] = toDailyVisitColumns(listDays('2026-10-26', 1));

		expect(column?.label).toBe('lundi 26 octobre');
		expect(column?.valueLabel).toBe('Aucune visite');
	});
});

describe('findShownHourRange', () => {
	it('shows a pharmacy day when nobody visited', () => {
		expect(findShownHourRange(emptyBusynessGrid())).toEqual({ firstHour: 8, endHour: 20 });
	});

	it('widens to the hours that had visits', () => {
		const grid = emptyBusynessGrid();
		grid[2]![6] = 3;
		grid[5]![22] = 1;

		expect(findShownHourRange(grid)).toEqual({ firstHour: 6, endHour: 23 });
	});
});

describe('toBusynessRows', () => {
	it('gives one row per weekday, from Monday, with one cell per shown hour', () => {
		const grid = emptyBusynessGrid();
		grid[0]![9] = 4;

		const rows = toBusynessRows(grid, { firstHour: 8, endHour: 11 });

		expect(rows.map((row) => row.label)).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
		expect(rows[0]?.cells).toEqual([
			{ value: 0, label: 'Lundi de 8 h à 9 h : aucune visite' },
			{ value: 4, label: 'Lundi de 9 h à 10 h : 4 visites' },
			{ value: 0, label: 'Lundi de 10 h à 11 h : aucune visite' }
		]);
	});
});

describe('toHourColumnLabels', () => {
	it('labels every other hour', () => {
		expect(toHourColumnLabels({ firstHour: 7, endHour: 11 })).toEqual(['', '8 h', '', '10 h']);
	});
});

describe('describeBusiestSlot', () => {
	it('names the weekday and the hour', () => {
		expect(describeBusiestSlot({ weekday: 5, hour: 10 })).toBe('Samedi, 10 h – 11 h');
	});

	it('says nothing without visits', () => {
		expect(describeBusiestSlot(undefined)).toBeUndefined();
	});
});
