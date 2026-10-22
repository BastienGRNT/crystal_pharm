import { describe, expect, it } from 'vitest';
import {
	countAppointmentsByStatus,
	filterAppointmentsByStatus,
	formatAppointmentHours,
	getPatientInitials,
	listAppointmentsOfDay,
	sortAppointmentsByStartTime,
	type Appointment
} from './appointment';

const appointment = (overrides: Partial<Appointment>): Appointment => ({
	id: 'id',
	day: '2026-10-22',
	startTime: '09:00',
	endTime: '09:15',
	patientName: 'Camille Durand',
	patientPhone: '06 00 00 00 00',
	reason: 'Vaccination',
	employeeId: 'employee-lea',
	status: 'confirmed',
	...overrides
});

const appointments = [
	appointment({ id: 'b', startTime: '10:30', status: 'pending' }),
	appointment({ id: 'a', startTime: '08:45', status: 'confirmed' }),
	appointment({ id: 'c', startTime: '09:15', status: 'cancelled' }),
	appointment({ id: 'd', startTime: '11:00', status: 'pending' })
];

describe('sortAppointmentsByStartTime', () => {
	it('range les rendez-vous du plus tôt au plus tard', () => {
		expect(sortAppointmentsByStartTime(appointments).map(({ id }) => id)).toEqual(['a', 'c', 'b', 'd']);
	});

	it('range d’abord par jour', () => {
		const earlierDay = appointment({ id: 'z', day: '2026-10-21', startTime: '18:00' });
		expect(sortAppointmentsByStartTime([...appointments, earlierDay])[0]?.id).toBe('z');
	});
});

describe('listAppointmentsOfDay', () => {
	it('ne garde que les rendez-vous du jour demandé', () => {
		const otherDay = appointment({ id: 'e', day: '2026-10-23' });
		expect(listAppointmentsOfDay([...appointments, otherDay], '2026-10-23')).toEqual([otherDay]);
	});
});

describe('filterAppointmentsByStatus', () => {
	it('garde tous les rendez-vous sans filtre', () => {
		expect(filterAppointmentsByStatus(appointments, 'all')).toHaveLength(4);
	});

	it('ne garde que le statut demandé', () => {
		expect(filterAppointmentsByStatus(appointments, 'pending').map(({ id }) => id)).toEqual(['b', 'd']);
	});
});

describe('countAppointmentsByStatus', () => {
	it('compte le total et chaque statut', () => {
		expect(countAppointmentsByStatus(appointments)).toEqual({ all: 4, pending: 2, confirmed: 1, cancelled: 1 });
	});
});

describe('formatAppointmentHours', () => {
	it('affiche le début et la fin séparés par un tiret demi-cadratin', () => {
		expect(formatAppointmentHours(appointment({ startTime: '08:30', endTime: '09:00' }))).toBe('08:30–09:00');
	});
});

describe('getPatientInitials', () => {
	it('prend la première lettre du prénom et du nom', () => {
		expect(getPatientInitials('Jean-Pierre de La Fontaine')).toBe('JF');
	});

	it('prend deux lettres pour un seul mot', () => {
		expect(getPatientInitials('  léa ')).toBe('LÉ');
	});
});
