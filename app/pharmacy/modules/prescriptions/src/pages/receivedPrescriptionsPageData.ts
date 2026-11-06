import type { DescriptionItem, FilterTab, TagTone } from '@crystal-pharm/ui';
import type { PlannedVisitUrgency } from '../domain/prescriptionQueue';
import type { PrescriptionStatus } from '../domain/receivedPrescription';

export type PrescriptionStep = {
	status: PrescriptionStatus;
	label: string;
	/** Avec `ready` : le patient a laissé son email, il est prévenu dans la foulée. */
	notifiesByEmail: boolean;
};

export type PrescriptionCard = {
	id: string;
	href: string;
	patientName: string;
	phone: string;
	phoneHref: string;
	plannedVisit: { label: string; urgency: PlannedVisitUrgency };
	receivedLabel: string;
	tags: { label: string; tone: TagTone }[];
	/** « Produits attendus jeudi 5 novembre ». */
	expectedProductsLabel: string | null;
	noteFromPatient: string | null;
	nextStep: PrescriptionStep | null;
	/** En préparation : l'autre geste courant, signaler un produit manquant. */
	missingProductsHref: string | null;
	/** Nom et téléphone en minuscules, pour la recherche faite dans le navigateur. */
	searchText: string;
	isSelected: boolean;
};

export type PrescriptionColumn = {
	status: PrescriptionStatus;
	title: string;
	emptyLabel: string;
	cards: PrescriptionCard[];
};

export type PrescriptionDocument = {
	id: string;
	label: string;
	href: string;
	/** Une photo s'affiche dans la fiche ; un PDF (ou un HEIC, que les navigateurs lisent mal) s'ouvre à côté. */
	isPreviewable: boolean;
};

export type SelectedPrescription = {
	id: string;
	patientName: string;
	closeHref: string;
	status: PrescriptionStatus;
	steps: string[];
	currentStepIndex: number;
	nextStep: PrescriptionStep | null;
	/** Les autres statuts, pour revenir en arrière après une erreur. */
	otherStatuses: { status: PrescriptionStatus; label: string }[];
	phone: string;
	phoneHref: string;
	email: string | null;
	identity: DescriptionItem[];
	visit: DescriptionItem[];
	waitingForProducts: { expectedLabel: string } | null;
	noteFromPatient: string | null;
	teamNote: string;
	documents: PrescriptionDocument[];
	isCollected: boolean;
	/** Le jour où le C# l'efface de lui-même. */
	retentionNotice: string;
	/** Le premier jour accepté pour l'arrivée des produits. */
	earliestExpectedProductsOn: string;
};

export type ReceivedPrescriptionsPageData = {
	context: string;
	columns: PrescriptionColumn[];
	/** Sur un écran étroit, une seule colonne à la fois. */
	columnTabs: FilterTab[];
	currentColumnStatus: PrescriptionStatus;
	collected: PrescriptionColumn;
	hasAnyPrescription: boolean;
	selected: SelectedPrescription | null;
};

export type ReceivedPrescriptionsActionResult = {
	/** Ce qui vient de se passer, en une phrase. */
	notice?: string;
	errorMessage?: string;
};
