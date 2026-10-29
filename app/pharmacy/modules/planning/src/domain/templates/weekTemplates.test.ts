import { describe, expect, it } from 'vitest';
import { getRotationOfWeek, pickTemplateForWeek, toShiftsOfWeek, toTemplateShifts, type WeekTemplate } from './weekTemplates';

const template = (id: string, rotation: WeekTemplate['rotation']): WeekTemplate => ({ id, name: id, rotation, shifts: [] });

describe('rotation', () => {
	it('alterne A et B d’une semaine à l’autre', () => {
		const first = getRotationOfWeek(new Date('2026-10-26T00:00:00Z'));
		const next = getRotationOfWeek(new Date('2026-11-02T00:00:00Z'));
		expect(first).not.toBe(next);
	});

	it('choisit la semaine type de la rotation, sinon celle sans rotation', () => {
		const monday = new Date('2026-10-26T00:00:00Z');
		const rotation = getRotationOfWeek(monday);
		const other = rotation === 'A' ? 'B' : 'A';
		expect(pickTemplateForWeek([template('autre', other), template(rotation, rotation)], monday)?.id).toBe(rotation);
		expect(pickTemplateForWeek([template('autre', other), template('toujours', undefined)], monday)?.id).toBe('toujours');
		expect(pickTemplateForWeek([template('autre', other)], monday)).toBeUndefined();
	});
});

describe('passage entre créneaux et semaine type', () => {
	it('garde le jour de la semaine et le rejoue sur une autre semaine', () => {
		const templateShifts = toTemplateShifts([{ id: '1', employeeId: 'e', date: '2026-10-28', startTime: '09:00', endTime: '12:00' }]);
		expect(templateShifts[0]?.weekday).toBe(2);
		const shifts = toShiftsOfWeek({ id: 't', name: 't', rotation: undefined, shifts: templateShifts }, new Date('2026-11-02T00:00:00Z'));
		expect(shifts).toEqual([{ employeeId: 'e', date: '2026-11-04', startTime: '09:00', endTime: '12:00' }]);
	});
});
