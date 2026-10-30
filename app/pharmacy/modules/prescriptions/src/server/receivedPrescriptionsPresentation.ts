import type { DescriptionItem } from '@crystal-pharm/ui';
import type {
	ReceivedDocumentKind,
	ReceivedPrescription,
	ReceivedPrescriptionSummary
} from '../domain/receivedPrescription';
import type { PrescriptionRow, SelectedPrescription } from '../pages/receivedPrescriptionsPageData';

const documentLabels: Record<ReceivedDocumentKind, string> = {
	prescription: 'Ordonnance',
	vitalCard: 'Carte Vitale',
	mutualCardFront: 'Mutuelle (recto)',
	mutualCardBack: 'Mutuelle (verso)'
};

const dayFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const dayAndTimeFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

// Une date sans fuseau (« 2026-10-26T14:30 ») ou de naissance se lit telle quelle, sans décalage.
const formatDay = (isoDate: string): string => dayFormatter.format(new Date(`${isoDate.slice(0, 10)}T12:00:00`));
const formatLocalDateTime = (isoDateTime: string): string => dayAndTimeFormatter.format(new Date(isoDateTime));
const formatPatientName = (person: { firstName: string; lastName: string }): string =>
	`${person.firstName} ${person.lastName.toLocaleUpperCase('fr-FR')}`;

export function buildPrescriptionRows(
	summaries: ReceivedPrescriptionSummary[],
	selectedId: string | null
): PrescriptionRow[] {
	return summaries.map((summary) => ({
		id: summary.id,
		href: `?ordonnance=${summary.id}`,
		patientName: formatPatientName(summary),
		phone: summary.phone,
		plannedVisit: formatLocalDateTime(summary.plannedVisitAt),
		receivedAt: formatLocalDateTime(summary.submittedAt),
		hasAlreadyVisited: summary.hasAlreadyVisited,
		documentCount: summary.documentCount,
		isSelected: summary.id === selectedId
	}));
}

export function buildSelectedPrescription(prescription: ReceivedPrescription): SelectedPrescription {
	const items: DescriptionItem[] = [
		{ label: 'Date de naissance', value: formatDay(prescription.birthDate) },
		{ label: 'Téléphone', value: prescription.phone },
		...(prescription.socialSecurityNumber
			? [{ label: 'Numéro de sécurité sociale', value: prescription.socialSecurityNumber }]
			: []),
		{ label: 'Passage prévu', value: formatLocalDateTime(prescription.plannedVisitAt) },
		{
			label: 'Déjà venu(e) à la pharmacie',
			value: prescription.hasAlreadyVisited ? 'Oui' : 'Non'
		},
		{ label: 'Reçue le', value: formatLocalDateTime(prescription.submittedAt) }
	];

	return {
		patientName: formatPatientName(prescription),
		items,
		files: prescription.documents.map((document) => ({
			label: documentLabels[document.kind],
			href: `/prescriptions/${prescription.id}/fichiers/${document.id}`
		})),
		closeHref: '?'
	};
}
