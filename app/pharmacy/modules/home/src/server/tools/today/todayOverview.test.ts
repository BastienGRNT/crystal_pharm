import { describe, expect, it } from 'vitest';
import { buildTodayOverview, computeDayRange, listClosedRanges, type TodayOverviewInput } from './todayOverview';

const team: NonNullable<TodayOverviewInput['team']> = {
	href: '/planning',
	summary: {
		teamSize: 5,
		shifts: [
			{ id: 'shift-1', personName: 'Léa Garcia', isPharmacist: true, startMinutes: 6 * 60, endMinutes: 8 * 60 + 45 },
			{ id: 'shift-2', personName: 'Camille Fontaine', isPharmacist: false, startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 },
			{ id: 'shift-3', personName: 'Julien Mercier', isPharmacist: false, startMinutes: 8 * 60 + 30, endMinutes: 12 * 60 + 30 }
		],
		pharmacistCoverageGaps: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 + 30, label: '09:00–12:30' }],
		dayQuery: '?view=day&day=2026-10-24'
	}
};

const appointments: NonNullable<TodayOverviewInput['appointments']> = {
	href: '/booking',
	summary: {
		appointments: [
			{
				id: 'appointment-1',
				startMinutes: 9 * 60 + 30,
				endMinutes: 9 * 60 + 45,
				startTime: '09:30',
				reason: 'Vaccination',
				status: 'confirmed',
				detailQuery: '?jour=2026-10-24&rdv=appointment-1'
			},
			{
				id: 'appointment-2',
				startMinutes: 10 * 60 + 15,
				endMinutes: 10 * 60 + 30,
				startTime: '10:15',
				reason: 'Test antigénique',
				status: 'pending',
				detailQuery: '?jour=2026-10-24&rdv=appointment-2'
			}
		],
		pendingCount: 2,
		pendingQuery: '?jour=2026-10-24&vue=semaine&statut=en-attente'
	}
};

const saturdayMorning = [{ startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 }];

const input: TodayOverviewInput = { isoDate: '2026-10-24', nowMinutes: 10 * 60, openingPeriods: saturdayMorning, team, appointments };

describe('buildTodayOverview', () => {
	const overview = buildTodayOverview(input);

	it('titre la journée avec ses horaires d’ouverture', () => {
		expect(overview.dateLabel).toBe('Samedi 24 octobre');
		expect(overview.openingLabel).toBe('ouvert de 09:00 à 12:30');
		expect(buildTodayOverview({ ...input, openingPeriods: [] }).openingLabel).toBe('fermé aujourd’hui');
		expect(buildTodayOverview({ ...input, openingPeriods: undefined }).openingLabel).toBeUndefined();
	});

	it('dit une seule fois les heures sans pharmacien, avec le lien qui les corrige', () => {
		expect(overview.coverageAlert).toEqual({
			text: 'Aujourd’hui, 09:00–12:30 : aucun pharmacien n’est planifié.',
			correctionHref: '/planning?view=day&day=2026-10-24'
		});
	});

	it('donne les chiffres du jour, présents sur toute l’équipe', () => {
		expect(overview.keyFigures.map((keyFigure) => [keyFigure.label, keyFigure.value, keyFigure.module])).toEqual([
			['Rendez-vous aujourd’hui', '2', 'rdv'],
			['À confirmer cette semaine', '2', 'rdv'],
			['Équipe présente', '3 / 5', 'planning']
		]);
		expect(overview.keyFigures[1]?.link?.href).toBe('/booking?jour=2026-10-24&vue=semaine&statut=en-attente');
	});

	it('cadre la frise sur l’ouverture et grise les heures fermées', () => {
		expect(overview.timeline?.hours.map((hour) => hour.label)).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']);
		const closedRanges = overview.timeline?.closedRanges ?? [];
		expect(closedRanges.map((closedRange) => [closedRange.startPercent, Math.round(closedRange.widthPercent * 100) / 100])).toEqual([
			[0, 16.67],
			[75, 25]
		]);
	});

	it('colore chaque ligne par son module et met le trou sur la ligne des pharmaciens seulement', () => {
		expect(overview.timeline?.rows.map((row) => [row.label, row.module, row.gaps?.length ?? 0])).toEqual([
			['Pharmaciens', 'planning', 1],
			['Préparateurs', 'planning', 0],
			['Rendez-vous', 'rdv', 0]
		]);
	});

	it('coupe au cadre un créneau qui commence avant', () => {
		const [pharmacistBar] = overview.timeline?.rows[0]?.bars ?? [];
		expect(pharmacistBar).toMatchObject({ startPercent: 0, widthPercent: 12.5, detail: '06:00–08:45' });
	});

	it('liste les rendez-vous du jour sans jamais nommer le patient', () => {
		expect(overview.appointmentItems?.map((item) => `${item.timeLabel} ${item.title} · ${item.detail}`)).toEqual([
			'09:30 Vaccination · Confirmé',
			'10:15 Test antigénique · À confirmer'
		]);
	});

	it('signale des rendez-vous qui n’ont pas répondu, sans en compter', () => {
		const withoutAppointments = buildTodayOverview({ ...input, appointments: { href: '/booking', summary: undefined } });
		expect(withoutAppointments.areAppointmentsUnavailable).toBe(true);
		expect(withoutAppointments.keyFigures.map((keyFigure) => keyFigure.label)).toEqual(['Équipe présente']);
	});
});

describe('computeDayRange', () => {
	it('prend une heure de marge autour de l’ouverture, arrondie à l’heure pleine', () => {
		expect(computeDayRange(saturdayMorning, [])).toEqual({ startMinutes: 8 * 60, endMinutes: 14 * 60 });
	});

	it('suit ce qui est prévu un jour fermé, sinon va de 8:00 à 20:00', () => {
		expect(computeDayRange([], [{ startMinutes: 10 * 60 + 15, endMinutes: 11 * 60 }])).toEqual({ startMinutes: 10 * 60, endMinutes: 11 * 60 });
		expect(computeDayRange([], [])).toEqual({ startMinutes: 8 * 60, endMinutes: 20 * 60 });
	});
});

describe('listClosedRanges', () => {
	it('grise avant, entre et après les plages d’ouverture', () => {
		const range = { startMinutes: 8 * 60, endMinutes: 21 * 60 };
		const weekday = [
			{ startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 },
			{ startMinutes: 14 * 60, endMinutes: 19 * 60 + 30 }
		];
		expect(listClosedRanges(weekday, range)).toEqual([
			{ startMinutes: 8 * 60, endMinutes: 9 * 60 },
			{ startMinutes: 12 * 60 + 30, endMinutes: 14 * 60 },
			{ startMinutes: 19 * 60 + 30, endMinutes: 21 * 60 }
		]);
	});
});
