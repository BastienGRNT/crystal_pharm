import { desc, eq, inArray } from 'drizzle-orm';
import type { BillingTransaction } from '../database/billingDatabase.server';
import { offers, offerVersions, offerVersionTools } from '../database/billingTables';
import type { ToolKey } from '../tools/tools';
import { packOfferKey } from './offerKeys';

export { packOfferKey };

/** Une offre vue à travers sa dernière version : ce qu'on vend aujourd'hui. */
export type CurrentOffer = {
	offerKey: string;
	label: string;
	offerVersionId: string;
	versionNumber: number;
	monthlyPriceCents: number;
	toolKeys: ToolKey[];
};

export type OfferVersionDetails = Omit<CurrentOffer, 'label'> & { offerKey: string };

export async function readOfferVersion(transaction: BillingTransaction, offerVersionId: string): Promise<OfferVersionDetails> {
	const [versionRow] = await transaction.select().from(offerVersions).where(eq(offerVersions.id, offerVersionId));
	if (!versionRow) throw new Error(`The offer version ${offerVersionId} does not exist.`);
	const toolRows = await transaction
		.select({ toolKey: offerVersionTools.toolKey })
		.from(offerVersionTools)
		.where(eq(offerVersionTools.offerVersionId, offerVersionId));
	return {
		offerKey: versionRow.offerKey,
		offerVersionId: versionRow.id,
		versionNumber: versionRow.versionNumber,
		monthlyPriceCents: versionRow.monthlyPriceCents,
		toolKeys: toolRows.map((toolRow) => toolRow.toolKey)
	};
}

export async function readLatestOfferVersion(transaction: BillingTransaction, offerKey: string): Promise<CurrentOffer | undefined> {
	const [offerRow] = await transaction.select().from(offers).where(eq(offers.offerKey, offerKey));
	if (!offerRow) return undefined;
	const [latestVersionRow] = await transaction
		.select({ id: offerVersions.id })
		.from(offerVersions)
		.where(eq(offerVersions.offerKey, offerKey))
		.orderBy(desc(offerVersions.versionNumber))
		.limit(1);
	if (!latestVersionRow) return undefined;
	return { ...(await readOfferVersion(transaction, latestVersionRow.id)), label: offerRow.label };
}

export async function readOfferLabels(transaction: BillingTransaction, offerKeys: readonly string[]): Promise<Map<string, string>> {
	if (offerKeys.length === 0) return new Map();
	const offerRows = await transaction.select().from(offers).where(inArray(offers.offerKey, [...offerKeys]));
	return new Map(offerRows.map((offerRow) => [offerRow.offerKey, offerRow.label]));
}

/** Les offres en vente, par leur dernière version. */
export async function listOffersOnSale(transaction: BillingTransaction): Promise<CurrentOffer[]> {
	const offerRows = await transaction.select().from(offers).where(eq(offers.isOnSale, true));
	const offersOnSale: CurrentOffer[] = [];
	for (const offerRow of offerRows) {
		const latestOffer = await readLatestOfferVersion(transaction, offerRow.offerKey);
		if (latestOffer) offersOnSale.push(latestOffer);
	}
	return offersOnSale.sort((first, second) => first.monthlyPriceCents - second.monthlyPriceCents);
}
