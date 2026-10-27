import type { ToolKey } from '../tools/tools';

/** Une ligne de la lecture des droits : un Tool, jusqu'où il est payé, jusqu'où il reste ouvert. */
export type ToolAccessLine = { toolKey: ToolKey; paidUntil: Date; endsAt: Date };

export type OverduePayment = {
	/** La fin de la période payée, dépassée. */
	paidUntil: Date;
	/** Le jour où les modules se ferment si rien n'est réglé. */
	modulesCloseAt: Date;
};

export type ToolAccessSummary = {
	accessibleToolKeys: ToolKey[];
	/** Défini tant que l'accès ne tient que par la grâce d'un paiement en retard. */
	overduePayment: OverduePayment | undefined;
};

/** Ce que disent les lignes lues, à l'instant `now` : les Tools ouverts, et si on est en grâce. */
export function summarizeToolAccess(lines: readonly ToolAccessLine[], now: Date): ToolAccessSummary {
	const openLines = lines.filter((line) => line.endsAt > now);
	const overdueLines = openLines.filter((line) => now > line.paidUntil);
	const firstClosingOverdueLine = overdueLines.reduce<ToolAccessLine | undefined>(
		(earliest, line) => (!earliest || line.endsAt < earliest.endsAt ? line : earliest),
		undefined
	);
	return {
		accessibleToolKeys: [...new Set(openLines.map((line) => line.toolKey))],
		overduePayment: firstClosingOverdueLine && {
			paidUntil: firstClosingOverdueLine.paidUntil,
			modulesCloseAt: firstClosingOverdueLine.endsAt
		}
	};
}
