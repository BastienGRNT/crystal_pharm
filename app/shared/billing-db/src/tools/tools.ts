/**
 * Les Tools de `pharmacy`, écrits une seule fois : prix, contrats, accès et
 * menu se déduisent de leur `toolKey`. Ajouter un Tool = l'ajouter ici, puis lui
 * donner un prix dans `admin` (sans prix, il n'est pas en vente).
 *
 * Un Tool `includedWith` n'est jamais vendu seul : il est compris dès que la
 * pharmacie a l'un de ces Tools (les services aux patients viennent avec le site,
 * par lequel les patients les utilisent).
 *
 * `offerLabel` : le nom sous lequel un Tool se vend, quand il diffère de celui du
 * menu (le site se vend avec les services qu'il apporte).
 */
export const tools = [
	{
		toolKey: 'site',
		label: 'Site internet',
		offerLabel: 'Votre pharmacie en ligne',
		pitch: 'Votre site internet, à votre image : vos patients vous y trouvent, vous envoient leurs ordonnances et prennent rendez-vous.'
	},
	{
		toolKey: 'planning',
		label: 'Planning',
		pitch: 'Le planning de votre équipe, ses absences et ses présences, au même endroit.'
	},
	{
		toolKey: 'booking',
		label: 'Rendez-vous',
		pitch: 'Vos patients réservent vaccins, tests et entretiens en ligne, sans appeler la pharmacie.',
		includedWith: ['site']
	},
	{
		toolKey: 'prescriptions',
		label: 'Ordonnances',
		pitch: 'Vos patients vous envoient leurs ordonnances 24 h/24 : elles sont prêtes quand ils arrivent.',
		includedWith: ['site']
	}
] as const satisfies readonly ToolDefinition[];

type ToolDefinition = { toolKey: string; label: string; offerLabel?: string; pitch: string; includedWith?: readonly string[] };

export type ToolKey = (typeof tools)[number]['toolKey'];

export type Tool = (typeof tools)[number];

export const toolKeys: readonly ToolKey[] = tools.map((tool) => tool.toolKey);

export function isToolKey(candidate: string): candidate is ToolKey {
	return (toolKeys as readonly string[]).includes(candidate);
}

export function findTool(toolKey: ToolKey): Tool {
	const tool = tools.find((candidate) => candidate.toolKey === toolKey);
	if (!tool) throw new Error(`The tool ${toolKey} does not exist.`);
	return tool;
}

/** Les Tools qui donnent ce Tool en plus ; vide pour un Tool vendu. */
export function findIncludingToolKeys(toolKey: ToolKey): readonly ToolKey[] {
	const tool: ToolDefinition = findTool(toolKey);
	return (tool.includedWith ?? []).filter(isToolKey);
}

/** Les Tools compris avec ce Tool ; vide pour un Tool qui ne donne rien en plus. */
export function findIncludedToolKeys(toolKey: ToolKey): readonly ToolKey[] {
	return toolKeys.filter((candidateToolKey) => findIncludingToolKeys(candidateToolKey).includes(toolKey));
}

/** « Votre pharmacie en ligne » pour le site, le nom du menu pour les autres. */
export function findOfferLabel(toolKey: ToolKey): string {
	const tool: ToolDefinition = findTool(toolKey);
	return tool.offerLabel ?? tool.label;
}

export function isIncludedTool(toolKey: ToolKey): boolean {
	return findIncludingToolKeys(toolKey).length > 0;
}

/** Les Tools qui se vendent : ceux qui ont un prix, une prise en charge, une case à cocher. */
export const sellableToolKeys: readonly ToolKey[] = toolKeys.filter((toolKey) => !isIncludedTool(toolKey));

/** « avec Rendez-vous et Ordonnances compris » ; rien pour un Tool qui ne donne rien en plus. */
export function describeIncludedTools(toolKey: ToolKey): string | undefined {
	const includedLabels = findIncludedToolKeys(toolKey).map((includedToolKey) => findTool(includedToolKey).label);
	return includedLabels.length > 0 ? `avec ${joinToolLabels(includedLabels)} compris` : undefined;
}

/** « Site internet, Planning et Rendez-vous » */
export function joinToolLabels(labels: readonly string[]): string {
	if (labels.length <= 1) return labels.join('');
	return `${labels.slice(0, -1).join(', ')} et ${labels.at(-1)}`;
}

/** « Compris avec Site internet » */
export function describeInclusion(toolKey: ToolKey): string {
	const includingLabels = findIncludingToolKeys(toolKey).map((includingToolKey) => findTool(includingToolKey).label);
	return `Compris avec ${includingLabels.join(' ou ')}`;
}
