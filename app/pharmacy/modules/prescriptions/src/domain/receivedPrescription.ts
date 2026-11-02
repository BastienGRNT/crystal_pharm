export type ReceivedDocumentKind = 'prescription' | 'vitalCard' | 'mutualCardFront' | 'mutualCardBack';

export type ReceivedDocumentFormat = 'jpeg' | 'png' | 'webp' | 'heic' | 'pdf';

export type ReceivedDocument = {
	id: string;
	kind: ReceivedDocumentKind;
	format: ReceivedDocumentFormat;
};

/** Le chemin d'une ordonnance au comptoir, dans l'ordre où l'équipe la traite. */
export type PrescriptionStatus = 'received' | 'inPreparation' | 'waitingForProducts' | 'ready' | 'collected';

export type ReceivedPrescriptionSummary = {
	id: string;
	submittedAt: string;
	firstName: string;
	lastName: string;
	phone: string;
	/** `null` : la personne passe dès que c'est prêt. */
	plannedVisitAt: string | null;
	hasAlreadyVisited: boolean;
	isRenewal: boolean;
	noteFromPatient: string | null;
	canBeNotifiedByEmail: boolean;
	status: PrescriptionStatus;
	statusChangedAt: string;
	expectedProductsOn: string | null;
	documentCount: number;
};

export type ReceivedPrescription = Omit<ReceivedPrescriptionSummary, 'documentCount' | 'canBeNotifiedByEmail'> & {
	birthDate: string;
	email: string | null;
	socialSecurityNumber: string | null;
	teamNote: string | null;
	documents: ReceivedDocument[];
};
