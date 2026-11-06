import { describe, expect, it } from 'vitest';
import {
	buildTodayOverview,
	computeDayRange,
	describeOpeningStatus,
	listClosedRanges,
	type TodayOverviewInput
} from './todayOverview';

const team: NonNullable<TodayOverviewInput['team']> = {
	href: '/planning',
	summary: {
		teamSize: 5,
		shifts: [
			{ id: 'shift-1', personName: 'Léa Garcia', jobTitle: 'Titulaire', isPharmacist: true, startMinutes: 6 * 60, endMinutes: 8 * 60 + 45 },
			{ id: 'shift-2', personName: 'Camille Fontaine', jobTitle: 'Préparatrice', isPharmacist: false, startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 },
			{ id: 'shift-3', personName: 'Julien Mercier', jobTitle: 'Préparateur', isPharmacist: false, startMinutes: 8 * 60 + 30, endMinutes: 12 * 60 + 30 }
		],
		pharmacistCoverageGaps: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 + 30, label: '09:00–12:30' }],
		dayQuery: '?view=day&day=2026-10-24',
		addShiftQuery: '?view=day&day=2026-10-24&add=1'
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
		pendingAppointments: [
			{ id: 'appointment-2', day: '2026-10-24', startTime: '10:15', reason: 'Test antigénique', detailQuery: '?jour=2026-10-24&rdv=appointment-2' },
			{ id: 'appointment-3', day: '2026-10-26', startTime: '09:30', reason: 'Vaccination', detailQuery: '?jour=2026-10-26&rdv=appointment-3' }
		],
		pendingCount: 2,
		pendingQuery: '?jour=2026-10-24&vue=semaine&statut=en-attente',
		newAppointmentQuery: '?jour=2026-10-24&nouveau=1'
	}
};

const prescriptions: NonNullable<TodayOverviewInput['prescriptions']> = {
	href: '/prescriptions',
	summary: {
		receivedCount: 2,
		inPreparationCount: 1,
		waitingForProductsCount: 1,
		readyCount: 2,
		overdueCount: 1,
		soonCount: 1,
		receivedQuery: '?statut=received',
		readyQuery: '?statut=ready'
	}
};

const saturdayMorning = [{ startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 }];

const input: TodayOverviewInput = {
	isoDate: '2026-10-24',
	nowMinutes: 10 * 60 + 12,
	currentInstant: new Date('2026-10-24T10:12:00+02:00'),
	openingPeriods: saturdayMorning,
	team,
	appointments,
	prescriptions,
	onDuty: undefined,
	confirmAppointmentFormAction: '?/confirmAppointment'
};

describe('buildTodayOverview', () => {
	const overview = buildTodayOverview(input);

	it('dit qui est au comptoir et qu’aucun pharmacien n’y est', () => {
		expect(overview.now.timeLabel).toBe('10:12');
		expect(overview.now.presentPeople?.map((person) => `${person.name} · ${person.detail}`)).toEqual([
			'Camille Fontaine · Préparatrice · jusqu’à 12:30',
			'Julien Mercier · Préparateur · jusqu’à 12:30'
		]);
		expect(overview.now.isPharmacistMissing).toBe(true);
	});

	it('annonce le prochain rendez-vous et dans combien de temps', () => {
		expect(overview.now.nextAppointment).toEqual({
			startTime: '10:15',
			reason: 'Test antigénique',
			detail: 'Dans 3 min · 15 min',
			isPending: true,
			href: '/booking?jour=2026-10-24&rdv=appointment-2'
		});
		expect(buildTodayOverview({ ...input, nowMinutes: 11 * 60 }).now.nextAppointment).toBeNull();
	});

	it('résume la journée en une ligne', () => {
		expect(overview.now.summary).toBe('2 rendez-vous aujourd’hui · 3 / 5 de l’équipe dans la journée');
	});

	it('met d’abord ce que la loi impose, puis les patients en retard, puis les rendez-vous à confirmer', () => {
		expect(overview.tasks.map((task) => [task.title, task.actions.map((action) => action.label)])).toEqual([
			['Aucun pharmacien, 09:00–12:30', ['Corriger le planning']],
			['1 ordonnance en retard', ['Voir']],
			['Test antigénique · aujourd’hui, 10:15', ['Confirmer', 'Voir']],
			['Vaccination · lun. 26 oct., 09:30', ['Confirmer', 'Voir']]
		]);
		expect(overview.tasks[2]?.actions[0]).toEqual({
			label: 'Confirmer',
			isPrimary: true,
			formAction: '?/confirmAppointment',
			name: 'appointmentId',
			value: 'appointment-2'
		});
	});

	it('ne demande plus de corriger un trou déjà passé', () => {
		expect(buildTodayOverview({ ...input, nowMinutes: 13 * 60 }).tasks.map((task) => task.id)).not.toContain('pharmacist-gap-540');
	});

	it('demande les horaires quand la fiche n’en a pas', () => {
		const withoutSchedule = buildTodayOverview({ ...input, openingPeriods: undefined });
		expect(withoutSchedule.openingStatus).toBeUndefined();
		expect(withoutSchedule.tasks.map((task) => task.id)).toContain('opening-schedule');
	});

	it('propose les raccourcis des modules actifs', () => {
		expect(overview.shortcuts.map((shortcut) => [shortcut.label, shortcut.href])).toEqual([
			['Nouveau rendez-vous', '/booking?jour=2026-10-24&nouveau=1'],
			['Ajouter quelqu’un au planning', '/planning?view=day&day=2026-10-24&add=1']
		]);
	});

	it('cadre la frise sur l’ouverture, colore les lignes et garde le trou sur celle des pharmaciens', () => {
		expect(overview.timeline?.hours.map((hour) => hour.label)).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']);
		expect(overview.timeline?.rows.map((row) => [row.label, row.module, row.gaps?.length ?? 0])).toEqual([
			['Pharmaciens', 'planning', 1],
			['Équipe', 'planning', 0],
			['Rendez-vous', 'rdv', 0]
		]);
		expect(overview.timeline?.rows[0]?.bars[0]).toMatchObject({ startPercent: 0, widthPercent: 12.5, detail: '06:00–08:45' });
	});

	it('marque les rendez-vous passés sur un téléphone, patient jamais nommé', () => {
		expect(overview.appointmentItems?.map((item) => `${item.timeLabel} ${item.title} · ${item.detail}`)).toEqual([
			'09:30 Vaccination · Passé',
			'10:15 Test antigénique · À confirmer'
		]);
	});

	it('reste utilisable quand les rendez-vous ne répondent pas', () => {
		const withoutAppointments = buildTodayOverview({ ...input, appointments: { href: '/booking', summary: undefined } });
		expect(withoutAppointments.areAppointmentsUnavailable).toBe(true);
		expect(withoutAppointments.now.nextAppointment).toBeUndefined();
		expect(withoutAppointments.tasks.map((task) => task.id)).toEqual(['pharmacist-gap-540', 'overdue-prescriptions']);
	});

	it('donne les chiffres du comptoir, chacun vers sa liste, le plus urgent en précision', () => {
		expect(overview.figures.map((figure) => [figure.label, figure.value, figure.detail, figure.href])).toEqual([
			['Ordonnances à préparer', '4', 'dont 1 en retard', '/prescriptions'],
			['Prêtes, pas encore retirées', '2', 'Le patient peut passer', '/prescriptions?statut=ready'],
			['Rendez-vous à confirmer', '2', 'Le patient attend votre réponse', '/booking?jour=2026-10-24&vue=semaine&statut=en-attente']
		]);
	});

	it('garde les chiffres des ordonnances quand le C# ne répond pas, sans inventer de nombre', () => {
		const withoutPrescriptions = buildTodayOverview({ ...input, prescriptions: { href: '/prescriptions', summary: undefined } });
		expect(withoutPrescriptions.figures[0]).toMatchObject({ value: '–', detail: 'Indisponible pour le moment' });
	});

	it('annonce la garde de ce soir, et la suivante plus discrètement', () => {
		const onDutyTonight = buildTodayOverview({
			...input,
			onDuty: { href: '/site-manager/gardes', period: { startsAt: '2026-10-24T19:00:00+02:00', endsAt: '2026-10-25T09:00:00+01:00' } }
		}).onDuty;
		expect(onDutyTonight).toEqual({
			title: 'De garde ce soir',
			detail: 'de 19:00 à 09:00 le lendemain',
			isSoon: true,
			isInProgress: false,
			href: '/site-manager/gardes'
		});
		const nextOnDuty = buildTodayOverview({
			...input,
			onDuty: { href: undefined, period: { startsAt: '2026-11-07T19:00:00+01:00', endsAt: '2026-11-08T09:00:00+01:00' } }
		}).onDuty;
		expect(nextOnDuty).toMatchObject({ title: 'Prochaine garde', detail: 'Sam. 7 nov., de 19:00 à 09:00 le lendemain', isSoon: false });
	});

	it('dit jusqu’à quand dure la garde en cours', () => {
		const inProgress = buildTodayOverview({
			...input,
			currentInstant: new Date('2026-10-24T23:30:00+02:00'),
			onDuty: { href: undefined, period: { startsAt: '2026-10-24T19:00:00+02:00', endsAt: '2026-10-25T09:00:00+01:00' } }
		});
		expect(inProgress.onDuty).toMatchObject({ title: 'De garde en ce moment', detail: 'jusqu’à demain 09:00' });
		expect(inProgress.openingStatus).toEqual({ label: 'Ouvert · de garde', tone: 'success' });
	});
});

describe('describeOpeningStatus', () => {
	const weekday = [
		{ startMinutes: 9 * 60, endMinutes: 12 * 60 + 30 },
		{ startMinutes: 14 * 60, endMinutes: 19 * 60 + 30 }
	];

	it('dit si la pharmacie est ouverte et jusqu’à quand, ou quand elle rouvre', () => {
		expect(describeOpeningStatus(weekday, 10 * 60)?.label).toBe('Ouvert · ferme à 12:30');
		expect(describeOpeningStatus(weekday, 13 * 60)?.label).toBe('Fermé · ouvre à 14:00');
		expect(describeOpeningStatus(weekday, 20 * 60)?.label).toBe('Fermé pour aujourd’hui');
		expect(describeOpeningStatus([], 10 * 60)?.label).toBe('Fermé aujourd’hui');
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
