import type { DescriptionItem, FilterTab, TagTone } from '@crystal-pharm/ui';
import {
	classifyPlannedVisitUrgency,
	countByStatus,
	findNextStatus,
	isStillToHandle,
	prescriptionStatusesInQueueOrder,
	sortForQueue
} from '../domain/prescriptionQueue';
import type {
	PrescriptionStatus,
	ReceivedDocument,
	ReceivedDocumentKind,
	ReceivedPrescription,
	ReceivedPrescriptionSummary
} from '../domain/receivedPrescription';
import type {
	PrescriptionCard,
	PrescriptionColumn,
	PrescriptionStep,
	ReceivedPrescriptionsPageData,
	SelectedPrescription
} from '../pages/receivedPrescriptionsPageData';

const documentLabels: Record<ReceivedDocumentKind, string> = {
	prescription: 'Ordonnance',
	vitalCard: 'Carte Vitale',
	mutualCardFront: 'Mutuelle, recto',
	mutualCardBack: 'Mutuelle, verso'
};

const columnTexts: Record<PrescriptionStatus, { title: string; emptyLabel: string }> = {
	received: { title: 'Reçues', emptyLabel: 'Aucune nouvelle ordonnance.' },
	inPreparation: { title: 'En préparation', emptyLabel: 'Rien en préparation.' },
	waitingForProducts: { title: 'Produits attendus', emptyLabel: 'Aucun produit en commande.' },
	ready: { title: 'Prêtes à retirer', emptyLabel: 'Rien n’attend au comptoir.' },
	collected: { title: 'Retirées', emptyLabel: 'Aucune ordonnance retirée récemment.' }
};

export const statusLabels: Record<PrescriptionStatus, string> = {
	received: 'Reçue',
	inPreparation: 'En préparation',
	waitingForProducts: 'Produits attendus',
	ready: 'Prête',
	collected: 'Retirée'
};

const steps = ['Reçue', 'En préparation', 'Prête', 'Retirée'];
const stepIndexes: Record<PrescriptionStatus, number> = {
	received: 0,
	inPreparation: 1,
	waitingForProducts: 1,
	ready: 2,
	collected: 3
};

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' });
const shortDayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const longDayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const birthDateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const millisecondsPerDay = 24 * 60 * 60 * 1000;

// « 14 h 30 », comme on l'écrit au comptoir, plutôt que « 14:30 ».
const formatTime = (date: Date): string => timeFormatter.format(date).replace(':', ' h ');

const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const daysBetween = (from: Date, to: Date): number => Math.round((startOfDay(to) - startOfDay(from)) / millisecondsPerDay);

// Une date seule (naissance, arrivée des produits) se lit à midi : aucun fuseau ne la fait changer de jour.
const parseDay = (isoDate: string): Date => new Date(`${isoDate.slice(0, 10)}T12:00:00`);

function formatRelativeDay(date: Date, now: Date): string {
	const dayOffset = daysBetween(now, date);
	if (dayOffset === 0) return 'Aujourd’hui';
	if (dayOffset === 1) return 'Demain';
	if (dayOffset === -1) return 'Hier';
	return shortDayFormatter.format(date);
}

const isStillToPrepare = (status: PrescriptionStatus): boolean =>
	status === 'received' || status === 'inPreparation' || status === 'waitingForProducts';

// Une fois prête, « dès que c'est prêt » ne dit plus rien : il peut passer quand il veut.
function formatPlannedVisit(plannedVisitAt: string | null, status: PrescriptionStatus, now: Date): string {
	if (!plannedVisitAt) return isStillToPrepare(status) ? 'Dès que c’est prêt' : 'Sans heure de passage';
	const plannedVisit = new Date(plannedVisitAt);
	return `${formatRelativeDay(plannedVisit, now)}, ${formatTime(plannedVisit)}`;
}

function formatExpectedDay(isoDate: string, now: Date): string {
	const expectedDay = parseDay(isoDate);
	const dayOffset = daysBetween(now, expectedDay);
	if (dayOffset === 0) return 'aujourd’hui';
	if (dayOffset === 1) return 'demain';
	return longDayFormatter.format(expectedDay);
}

function formatReceivedAt(submittedAt: string, now: Date): string {
	const submission = new Date(submittedAt);
	const dayOffset = daysBetween(submission, now);
	if (dayOffset === 0) return `Reçue à ${formatTime(submission)}`;
	if (dayOffset === 1) return `Reçue hier à ${formatTime(submission)}`;
	return `Reçue le ${shortDayFormatter.format(submission)}`;
}

function formatSentAt(submittedAt: string, now: Date): string {
	const submission = new Date(submittedAt);
	return `${formatRelativeDay(submission, now)}, ${formatTime(submission)}`;
}

function formatAge(birthDate: string, now: Date): string {
	const birth = parseDay(birthDate);
	const hasHadBirthdayThisYear =
		now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
	const age = now.getFullYear() - birth.getFullYear() - (hasHadBirthdayThisYear ? 0 : 1);
	return `${birthDateFormatter.format(birth)} (${age} ans)`;
}

const formatPatientName = (person: { firstName: string; lastName: string }): string =>
	`${person.firstName} ${person.lastName.toLocaleUpperCase('fr-FR')}`;

const toPhoneHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;

// Un numéro français se lit par paires au comptoir ; un autre format reste tel que saisi.
function formatPhoneForReading(phone: string): string {
	const digits = phone.replace(/\D/g, '');
	return digits.length === 10 && digits.startsWith('0') ? digits.replace(/(\d{2})(?=\d)/g, '$1 ') : phone;
}

const pluralize = (count: number, singular: string, plural: string): string => `${count} ${count > 1 ? plural : singular}`;

function buildStep(status: PrescriptionStatus, canBeNotifiedByEmail: boolean): PrescriptionStep | null {
	const nextStatus = findNextStatus(status);
	if (!nextStatus) return null;
	const notifiesByEmail = nextStatus === 'ready' && canBeNotifiedByEmail;
	const labels: Record<PrescriptionStatus, string> = {
		received: 'Remettre en reçue',
		inPreparation: 'Commencer la préparation',
		waitingForProducts: 'Produits manquants',
		ready: notifiesByEmail ? 'Prête, prévenir par email' : 'Marquer prête',
		collected: 'Marquer retirée'
	};
	return { status: nextStatus, label: labels[nextStatus], notifiesByEmail };
}

function buildTags(summary: ReceivedPrescriptionSummary): PrescriptionCard['tags'] {
	const tags: { label: string; tone: TagTone }[] = [];
	if (summary.isRenewal) tags.push({ label: 'Renouvellement', tone: 'accent' });
	if (!summary.hasAlreadyVisited) tags.push({ label: '1re visite', tone: 'warning' });
	if (summary.canBeNotifiedByEmail) tags.push({ label: 'Email', tone: 'neutral' });
	tags.push({ label: pluralize(summary.documentCount, 'fichier', 'fichiers'), tone: 'neutral' });
	return tags;
}

function buildCard(summary: ReceivedPrescriptionSummary, selectedId: string | null, now: Date): PrescriptionCard {
	const patientName = formatPatientName(summary);
	return {
		id: summary.id,
		href: `?ordonnance=${summary.id}`,
		patientName,
		phone: formatPhoneForReading(summary.phone),
		phoneHref: toPhoneHref(summary.phone),
		plannedVisit: {
			label: formatPlannedVisit(summary.plannedVisitAt, summary.status, now),
			urgency: summary.status === 'collected' ? 'later' : classifyPlannedVisitUrgency(summary.plannedVisitAt, now)
		},
		receivedLabel: formatReceivedAt(summary.submittedAt, now),
		tags: buildTags(summary),
		expectedProductsLabel:
			summary.status === 'waitingForProducts' && summary.expectedProductsOn
				? `Produits attendus ${formatExpectedDay(summary.expectedProductsOn, now)}`
				: null,
		noteFromPatient: summary.noteFromPatient,
		nextStep: buildStep(summary.status, summary.canBeNotifiedByEmail),
		missingProductsHref: summary.status === 'inPreparation' ? `?ordonnance=${summary.id}#produits-manquants` : null,
		searchText: `${summary.firstName} ${summary.lastName} ${summary.phone.replace(/\s/g, '')}`.toLocaleLowerCase('fr-FR'),
		isSelected: summary.id === selectedId
	};
}

function buildColumn(status: PrescriptionStatus, cards: PrescriptionCard[]): PrescriptionColumn {
	return { status, ...columnTexts[status], cards };
}

function buildContext(counts: Record<PrescriptionStatus, number>): string {
	const toHandleCount = counts.received + counts.inPreparation + counts.waitingForProducts;
	if (toHandleCount + counts.ready === 0) return 'Les ordonnances envoyées depuis votre site arrivent ici.';
	const parts = [pluralize(toHandleCount, 'à préparer', 'à préparer')];
	if (counts.received > 0) parts.push(pluralize(counts.received, 'nouvelle', 'nouvelles'));
	if (counts.ready > 0) parts.push(pluralize(counts.ready, 'prête au comptoir', 'prêtes au comptoir'));
	return parts.join(' · ');
}

function chooseCurrentColumn(requestedStatus: string | null, counts: Record<PrescriptionStatus, number>): PrescriptionStatus {
	const queueStatuses = prescriptionStatusesInQueueOrder.filter(isStillToHandle);
	const requested = queueStatuses.find((status) => status === requestedStatus);
	return requested ?? queueStatuses.find((status) => counts[status] > 0) ?? 'received';
}

export function buildQueue(
	summaries: readonly ReceivedPrescriptionSummary[],
	selectedId: string | null,
	requestedColumnStatus: string | null,
	now: Date
): Omit<ReceivedPrescriptionsPageData, 'selected'> {
	const sortedCards = sortForQueue(summaries).map((summary) => ({
		status: summary.status,
		card: buildCard(summary, selectedId, now)
	}));
	const cardsOf = (status: PrescriptionStatus): PrescriptionCard[] =>
		sortedCards.filter((entry) => entry.status === status).map((entry) => entry.card);
	const counts = countByStatus(summaries);
	const currentColumnStatus = chooseCurrentColumn(requestedColumnStatus, counts);
	const queueStatuses = prescriptionStatusesInQueueOrder.filter(isStillToHandle);

	return {
		context: buildContext(counts),
		columns: queueStatuses.map((status) => buildColumn(status, cardsOf(status))),
		columnTabs: queueStatuses.map(
			(status): FilterTab => ({
				label: columnTexts[status].title,
				href: `?statut=${status}`,
				isCurrent: status === currentColumnStatus,
				count: counts[status]
			})
		),
		currentColumnStatus,
		collected: buildColumn('collected', cardsOf('collected')),
		hasAnyPrescription: summaries.length > 0
	};
}

function buildDocument(prescriptionId: string, document: ReceivedDocument, sameKindIndex: number): SelectedPrescription['documents'][number] {
	const label = documentLabels[document.kind];
	return {
		id: document.id,
		label: sameKindIndex > 0 ? `${label} (page ${sameKindIndex + 1})` : label,
		href: `/prescriptions/${prescriptionId}/fichiers/${document.id}`,
		isPreviewable: document.format === 'jpeg' || document.format === 'png' || document.format === 'webp'
	};
}

function buildDocuments(prescription: ReceivedPrescription): SelectedPrescription['documents'] {
	const seenKinds = new Map<ReceivedDocumentKind, number>();
	return prescription.documents.map((document) => {
		const sameKindIndex = seenKinds.get(document.kind) ?? 0;
		seenKinds.set(document.kind, sameKindIndex + 1);
		return buildDocument(prescription.id, document, sameKindIndex);
	});
}

const toIsoDay = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function buildSelectedPrescription(prescription: ReceivedPrescription, now: Date): SelectedPrescription {
	const identity: DescriptionItem[] = [
		{ label: 'Date de naissance', value: formatAge(prescription.birthDate, now) },
		...(prescription.socialSecurityNumber
			? [{ label: 'N° de sécurité sociale', value: prescription.socialSecurityNumber }]
			: [])
	];
	const visit: DescriptionItem[] = [
		{ label: 'Passage prévu', value: formatPlannedVisit(prescription.plannedVisitAt, prescription.status, now) },
		{ label: 'Envoyée', value: formatSentAt(prescription.submittedAt, now) },
		{ label: 'Renouvellement', value: prescription.isRenewal ? 'Oui' : 'Non' },
		{ label: 'Déjà venu(e) à la pharmacie', value: prescription.hasAlreadyVisited ? 'Oui' : 'Non, 1re visite' }
	];

	return {
		id: prescription.id,
		patientName: formatPatientName(prescription),
		closeHref: '?',
		status: prescription.status,
		steps,
		currentStepIndex: stepIndexes[prescription.status],
		nextStep: buildStep(prescription.status, prescription.email !== null),
		otherStatuses: prescriptionStatusesInQueueOrder
			.filter((status) => status !== prescription.status && status !== 'waitingForProducts')
			.map((status) => ({ status, label: statusLabels[status] })),
		phone: formatPhoneForReading(prescription.phone),
		phoneHref: toPhoneHref(prescription.phone),
		email: prescription.email,
		identity,
		visit,
		waitingForProducts:
			prescription.status === 'waitingForProducts'
				? {
						expectedLabel: prescription.expectedProductsOn
							? formatExpectedDay(prescription.expectedProductsOn, now)
							: 'date à confirmer'
					}
				: null,
		noteFromPatient: prescription.noteFromPatient,
		teamNote: prescription.teamNote ?? '',
		documents: buildDocuments(prescription),
		isCollected: prescription.status === 'collected',
		retentionNotice:
			prescription.status === 'collected'
				? 'Effacée d’elle-même 30 jours après le retrait. Vous pouvez la supprimer dès maintenant.'
				: 'Effacée d’elle-même 90 jours après l’envoi si elle n’est jamais retirée.',
		earliestExpectedProductsOn: toIsoDay(now)
	};
}
