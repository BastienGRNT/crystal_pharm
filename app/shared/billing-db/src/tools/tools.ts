/**
 * Les Tools de `pharmacy`, écrits une seule fois : prix, contrats, accès et
 * menu se déduisent de leur `toolKey`. Ajouter un Tool = l'ajouter ici, puis lui
 * donner un prix dans `admin` (sans prix, il n'est pas en vente).
 *
 * Un Tool `includedWith` n'est jamais vendu seul : il est compris dès que la
 * pharmacie a l'un de ces Tools (les services aux patients viennent avec le site
 * ou le planning).
 */
export const tools = [
	{
		toolKey: 'site',
		label: 'Site internet',
		pitch: 'Le site de votre pharmacie, à votre image, modifiable en quelques clics.'
	},
	{
		toolKey: 'planning',
		label: 'Planning',
		pitch: 'Le planning de votre équipe, ses absences et ses présences, au même endroit.'
	},
	{
		toolKey: 'booking',
		label: 'Rendez-vous',
		pitch: 'Vos patients réservent en ligne : vaccins, tests, entretiens pharmaceutiques.',
		includedWith: ['site', 'planning']
	},
	{
		toolKey: 'prescriptions',
		label: 'Ordonnances',
		pitch: 'Vos patients vous envoient leurs ordonnances, vous les préparez à l’avance.',
		includedWith: ['site', 'planning']
	}
] as const satisfies readonly ToolDefinition[];

type ToolDefinition = { toolKey: string; label: string; pitch: string; includedWith?: readonly string[] };

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

export function isIncludedTool(toolKey: ToolKey): boolean {
	return findIncludingToolKeys(toolKey).length > 0;
}

/** Les Tools qui se vendent : ceux qui ont un prix, une prise en charge, une case à cocher. */
export const sellableToolKeys: readonly ToolKey[] = toolKeys.filter((toolKey) => !isIncludedTool(toolKey));

/** « Compris avec Site internet ou Planning » */
export function describeInclusion(toolKey: ToolKey): string {
	const includingLabels = findIncludingToolKeys(toolKey).map((includingToolKey) => findTool(includingToolKey).label);
	return `Compris avec ${includingLabels.join(' ou ')}`;
}
