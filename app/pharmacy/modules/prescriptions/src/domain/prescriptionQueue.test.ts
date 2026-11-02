import { describe, expect, it } from 'vitest';
import { classifyPlannedVisitUrgency, countByStatus, findNextStatus, sortForQueue } from './prescriptionQueue';
import type { ReceivedPrescriptionSummary } from './receivedPrescription';

const now = new Date('2026-10-31T10:00:00');

function prescription(overrides: Partial<ReceivedPrescriptionSummary>): ReceivedPrescriptionSummary {
	return {
		id: 'id',
		submittedAt: '2026-10-31T08:00:00',
		firstName: 'Lucie',
		lastName: 'Martin',
		phone: '06 12 34 56 78',
		plannedVisitAt: null,
		hasAlreadyVisited: false,
		isRenewal: false,
		noteFromPatient: null,
		canBeNotifiedByEmail: false,
		status: 'received',
		statusChangedAt: '2026-10-31T08:00:00',
		expectedProductsOn: null,
		documentCount: 1,
		...overrides
	};
}

describe('classifyPlannedVisitUrgency', () => {
	it('says when the person comes as soon as it is ready', () => {
		expect(classifyPlannedVisitUrgency(null, now)).toBe('whenReady');
	});

	it('flags a visit already past', () => {
		expect(classifyPlannedVisitUrgency('2026-10-31T09:30:00', now)).toBe('overdue');
	});

	it('flags a visit within two hours', () => {
		expect(classifyPlannedVisitUrgency('2026-10-31T12:00:00', now)).toBe('soon');
	});

	it('leaves a later visit calm', () => {
		expect(classifyPlannedVisitUrgency('2026-10-31T12:01:00', now)).toBe('later');
	});
});

describe('findNextStatus', () => {
	it('walks the counter path and stops once collected', () => {
		expect(findNextStatus('received')).toBe('inPreparation');
		expect(findNextStatus('inPreparation')).toBe('ready');
		expect(findNextStatus('waitingForProducts')).toBe('ready');
		expect(findNextStatus('ready')).toBe('collected');
		expect(findNextStatus('collected')).toBeNull();
	});
});

describe('sortForQueue', () => {
	it('puts the closest planned visit first, then the others by arrival', () => {
		const sorted = sortForQueue([
			prescription({ id: 'whenReadyLate', submittedAt: '2026-10-31T09:00:00' }),
			prescription({ id: 'afternoon', plannedVisitAt: '2026-10-31T16:00:00' }),
			prescription({ id: 'whenReadyEarly', submittedAt: '2026-10-31T07:00:00' }),
			prescription({ id: 'morning', plannedVisitAt: '2026-10-31T11:00:00' })
		]);
		expect(sorted.map(({ id }) => id)).toEqual(['morning', 'afternoon', 'whenReadyEarly', 'whenReadyLate']);
	});

	it('shows the last collected first', () => {
		const sorted = sortForQueue([
			prescription({ id: 'older', status: 'collected', statusChangedAt: '2026-10-29T10:00:00' }),
			prescription({ id: 'newer', status: 'collected', statusChangedAt: '2026-10-30T10:00:00' })
		]);
		expect(sorted.map(({ id }) => id)).toEqual(['newer', 'older']);
	});
});

describe('countByStatus', () => {
	it('counts every status, even the empty ones', () => {
		expect(countByStatus([prescription({ status: 'ready' }), prescription({ status: 'ready' })])).toEqual({
			received: 0,
			inPreparation: 0,
			waitingForProducts: 0,
			ready: 2,
			collected: 0
		});
	});
});
