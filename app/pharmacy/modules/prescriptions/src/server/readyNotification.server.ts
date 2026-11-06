import { composeRequestReadyEmail, sendEmail } from '@crystal-pharm/email';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';

/** L'email promis sur le site quand le patient a laissé son adresse : neutre, sans rien de l'ordonnance. */
export async function notifyPatientThatRequestIsReady(tenantId: string, patientEmail: string): Promise<void> {
	const pharmacy = await getPharmacyProfile(tenantId);
	await sendEmail(
		composeRequestReadyEmail({
			to: patientEmail,
			pharmacy: {
				name: pharmacy.name,
				address: `${pharmacy.street}, ${pharmacy.postalCode} ${pharmacy.city}`,
				phone: pharmacy.phoneNumber.toDisplayFormat()
			}
		})
	);
}
