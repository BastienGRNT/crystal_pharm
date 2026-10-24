import { describe, expect, it } from 'vitest';
import { buildTodayOverview, buildTodayTasks, computeDayRange, type TodayOverviewInput } from './todayOverview';

const team: NonNullable<TodayOverviewInput['team']> = {
	href: '/planning',
	summary: {
		isOpen: true,
		openingPeriods: [{ startMinutes: 9 * 60, endMinutes: 19 * 60 + 30 }],
		shifts: [
			{ id: 'shift-1', personName: 'Léa Garcia', isPharmacist: true, startMinutes: 9 * 60, endMinutes: 18 * 60 },
			{ id: 'shift-2', personName: 'Camille Fontaine', isPharmacist: false, startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 },
			{ id: 'shift-3', personName: 'Camille Fontaine', isPharmacist: false, startMinutes: 14 * 60, endMinutes: 19 * 60 + 30 }
		],
		pharmacistCoverageGaps: [{ startMinutes: 18 * 60, endMinutes: 19 * 60 + 30, label: '18:00–19:30' }],
		dayQuery: '?view=day&day=2026-10-24'
	}
};

const appointments: NonNullable<TodayOverviewInput['appointments']> = {
	href: '/booking',
	summary: {
		appointments: [
			{
				id: 'appointment-2',
				startMinutes: 14 * 60,
				endMinutes: 14 * 60 + 15,
				startTime: '14:00',
				reason: 'Test antigénique',
				status: 'pending',
				detailQuery: '?jour=2026-10-24&rdv=appointment-2'
			},
			{
				id: 'appointment-1',
				startMinutes: 9 * 60 + 30,
				endMinutes: 9 * 60 + 45,
				startTime: '09:30',
				reason: 'Vaccination',
				status: 'confirmed',
				detailQuery: '?jour=2026-10-24&rdv=appointment-1'
			}
		],
		pendingCount: 2,
		pendingQuery: '?jour=2026-10-24&vue=semaine&statut=en-attente'
	}
};

const input: TodayOverviewInput = { isoDate: '2026-10-24', nowMinutes: 10 * 60, team, appointments };

describe('buildTodayOverview', () => {
	const overview = buildTodayOverview(input);

	it('ne montre rien sans planning ni rendez-vous', () => {
		expect(buildTodayOverview({ ...input, team: undefined, appointments: undefined })).toBeUndefined();
	});

	it('titre la journée et compte les présents une seule fois chacun', () => {
		expect(overview?.dateLabel).toBe('Samedi 24 octobre');
		expect(overview?.summary).toBe('2 personnes · 2 rendez-vous');
	});

	it('range les pharmaciens, les autres et les rendez-vous sur trois lignes', () => {
		expect(overview?.timeline?.rows.map((row) => [row.label, row.bars.length])).toEqual([
			['Pharmaciens', 1],
			['Préparateurs', 2],
			['Rendez-vous', 2]
		]);
	});

	it('montre une heure sans pharmacien sur toute la hauteur de la frise', () => {
		expect(overview?.timeline?.gaps).toEqual([
			{ key: '1080', label: 'Sans pharmacien 18:00–19:30', startPercent: 10 * (100 / 12), widthPercent: 1.5 * (100 / 12) }
		]);
	});

	it('déroule la journée dans l’ordre des heures sur un téléphone, patient jamais nommé', () => {
		expect(overview?.agendaItems.map((item) => `${item.timeLabel} ${item.title}`)).toEqual([
			'09:30 Vaccination',
			'14:00 Test antigénique',
			'18:00 Aucun pharmacien'
		]);
	});

	it('signale des rendez-vous qui n’ont pas répondu', () => {
		const withoutAppointments = buildTodayOverview({ ...input, appointments: { href: '/booking', summary: undefined } });
		expect(withoutAppointments?.areAppointmentsUnavailable).toBe(true);
		expect(withoutAppointments?.timeline?.rows.at(-1)?.emptyLabel).toBe('Rendez-vous indisponibles pour le moment');
	});
});

describe('buildTodayTasks', () => {
	it('met les heures sans pharmacien en premier, puis les rendez-vous à confirmer, puis la fiche', () => {
		expect(buildTodayTasks(input, true).map((task) => [task.title, task.href])).toEqual([
			['Aucun pharmacien de 18:00 à 19:30', '/planning?view=day&day=2026-10-24'],
			['2 rendez-vous à confirmer', '/booking?jour=2026-10-24&vue=semaine&statut=en-attente'],
			['Renseigner vos horaires d’ouverture', '/pharmacie?onglet=horaires']
		]);
	});

	it('n’a rien à demander quand tout est à jour', () => {
		expect(buildTodayTasks({ ...input, team: undefined, appointments: undefined }, false)).toEqual([]);
	});
});

describe('computeDayRange', () => {
	it('va de 8:00 à 20:00 et s’élargit à l’heure pleine', () => {
		expect(computeDayRange([])).toEqual({ startMinutes: 8 * 60, endMinutes: 20 * 60 });
		expect(computeDayRange([{ startMinutes: 7 * 60 + 30, endMinutes: 20 * 60 + 15 }])).toEqual({
			startMinutes: 7 * 60,
			endMinutes: 21 * 60
		});
	});
});
