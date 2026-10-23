import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import { composePharmacyInvitationEmail, sendEmail } from '@crystal-pharm/email';
import type { SentPharmacyInvitation } from '@crystal-pharm/group-db';

/** Le lien mène à l'espace des pharmacies : c'est là qu'on accepte, connecté ou non. */
export async function emailPharmacyInvitation(sentInvitation: SentPharmacyInvitation): Promise<void> {
	await sendEmail(
		composePharmacyInvitationEmail({
			to: sentInvitation.email,
			groupName: sentInvitation.groupName,
			pharmacyName: sentInvitation.pharmacyName,
			invitationUrl: `${readRequiredEnvironmentVariable('PHARMACY_URL')}/invitation/${sentInvitation.invitationToken}`
		})
	);
}
