import { and, eq, isNull, or } from 'drizzle-orm';
import * as v from 'valibot';
import { runWithGroupAccess } from '../../database/groupDatabase.server';
import { pharmacyGroups, pharmacyMemberships } from '../../database/groupTables';
import type { PharmacyGroupImage } from '../profile/PharmacyGroupImage';
import { readStoredPharmacyGroupImage } from '../profile/pharmacyGroupImageFiles.server';
import type { PharmacyGroupProfile } from '../profile/pharmacyGroupProfiles.server';

/** Ce que le site d'une pharmacie montre du groupement dont elle est membre. */
export type GroupSiteProfileOfTenant = PharmacyGroupProfile & {
	groupId: string;
	/** Des noms de module de `engine/schema`, validés au rendu du site. */
	mandatoryModules: string[];
};

const UuidSchema = v.pipe(v.string(), v.uuid());

/** `undefined` si la pharmacie n'est membre d'aucun groupement. */
export async function findGroupSiteProfileOfTenant(tenantId: string): Promise<GroupSiteProfileOfTenant | undefined> {
	const [group] = await runWithGroupAccess({ tenantId }, (transaction) =>
		transaction
			.select({
				groupId: pharmacyGroups.id,
				name: pharmacyGroups.name,
				logoId: pharmacyGroups.logoId,
				loyaltyCardImageId: pharmacyGroups.loyaltyCardImageId,
				loyaltyCardUrl: pharmacyGroups.loyaltyCardUrl,
				loyaltyCardMessage: pharmacyGroups.loyaltyCardMessage,
				mandatoryModules: pharmacyGroups.mandatoryModules
			})
			.from(pharmacyMemberships)
			.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyMemberships.groupId))
			.where(and(eq(pharmacyMemberships.tenantId, tenantId), isNull(pharmacyMemberships.leftAt)))
	);
	if (!group) return undefined;
	return {
		groupId: group.groupId,
		name: group.name,
		logoId: group.logoId ?? undefined,
		loyaltyCardImageId: group.loyaltyCardImageId ?? undefined,
		loyaltyCardUrl: group.loyaltyCardUrl ?? undefined,
		loyaltyCardMessage: group.loyaltyCardMessage ?? undefined,
		mandatoryModules: group.mandatoryModules
	};
}

/** Une image du groupement actuel de la pharmacie, seulement si c'est son logo ou sa carte de fidélité. */
export async function readGroupImageOfTenant(tenantId: string, imageId: string): Promise<PharmacyGroupImage | undefined> {
	if (!v.is(UuidSchema, imageId)) return undefined;
	const [groupWithImage] = await runWithGroupAccess({ tenantId }, (transaction) =>
		transaction
			.select({ groupId: pharmacyGroups.id })
			.from(pharmacyMemberships)
			.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyMemberships.groupId))
			.where(
				and(
					eq(pharmacyMemberships.tenantId, tenantId),
					isNull(pharmacyMemberships.leftAt),
					or(eq(pharmacyGroups.logoId, imageId), eq(pharmacyGroups.loyaltyCardImageId, imageId))
				)
			)
	);
	return groupWithImage ? readStoredPharmacyGroupImage(groupWithImage.groupId, imageId) : undefined;
}
