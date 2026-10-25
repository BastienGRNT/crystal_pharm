export type ReceivedDocumentKind = 'prescription' | 'vitalCard' | 'mutualCardFront' | 'mutualCardBack';

export type ReceivedDocument = {
	id: string;
	kind: ReceivedDocumentKind;
};

export type ReceivedPrescriptionSummary = {
	id: string;
	submittedAt: string;
	firstName: string;
	lastName: string;
	phone: string;
	plannedVisitAt: string;
	hasAlreadyVisited: boolean;
	documentCount: number;
};

export type ReceivedPrescription = Omit<ReceivedPrescriptionSummary, 'documentCount'> & {
	birthDate: string;
	socialSecurityNumber: string | null;
	documents: ReceivedDocument[];
};
