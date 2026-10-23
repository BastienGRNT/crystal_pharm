import * as v from 'valibot';

/** Une ligne de la liste d'invitations : l'email du titulaire et, si on le connaît, le nom de la pharmacie. */
export type InvitationListEntry = { email: string; pharmacyName?: string };

export type InvitationListParsing = {
	entries: InvitationListEntry[];
	/** Les lignes où aucun email valide n'a été trouvé, telles qu'elles ont été saisies. */
	unreadableLines: string[];
};

const EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email());

const cellSeparators = /[;,\t]/;
const headerWords = /^(e-?mail|courriel|adresse)$/i;

/**
 * Lit une liste collée ou un CSV : un email par ligne, avec éventuellement le
 * nom de la pharmacie dans une autre colonne (`;`, `,` ou tabulation). La ligne
 * d'en-tête et les doublons sont ignorés.
 */
export function parseInvitationList(listText: string): InvitationListParsing {
	const entriesByEmail = new Map<string, InvitationListEntry>();
	const unreadableLines: string[] = [];

	for (const line of listText.split(/\r?\n/).map((rawLine) => rawLine.trim()).filter(Boolean)) {
		const cells = line.split(cellSeparators).map((cell) => cell.trim().replace(/^"|"$/g, ''));
		if (cells.some((cell) => headerWords.test(cell))) continue;

		const emailCell = cells.find((cell) => v.is(EmailSchema, cell));
		if (!emailCell) {
			unreadableLines.push(line);
			continue;
		}
		const email = v.parse(EmailSchema, emailCell);
		const pharmacyName = cells.filter((cell) => cell !== emailCell && cell !== '').join(' ').trim();
		if (!entriesByEmail.has(email)) entriesByEmail.set(email, pharmacyName ? { email, pharmacyName } : { email });
	}
	return { entries: [...entriesByEmail.values()], unreadableLines };
}
