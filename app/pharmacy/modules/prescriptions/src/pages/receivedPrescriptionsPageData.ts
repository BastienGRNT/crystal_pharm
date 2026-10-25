import type { DescriptionItem } from '@crystal-pharm/ui';

export type PrescriptionRow = {
	id: string;
	href: string;
	patientName: string;
	phone: string;
	plannedVisit: string;
	receivedAt: string;
	hasAlreadyVisited: boolean;
	documentCount: number;
	isSelected: boolean;
};

export type SelectedPrescription = {
	patientName: string;
	items: DescriptionItem[];
	files: { label: string; href: string }[];
	closeHref: string;
};

export type ReceivedPrescriptionsPageData = {
	rows: PrescriptionRow[];
	selected: SelectedPrescription | null;
};
