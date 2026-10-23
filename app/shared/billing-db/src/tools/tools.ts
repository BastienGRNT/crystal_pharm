/**
 * Les Tools payants de `pharmacy`, écrits une seule fois : prix, contrats,
 * accès et menu se déduisent de leur `toolKey`. Ajouter un Tool = l'ajouter
 * ici, puis lui donner un prix dans `admin` (sans prix, il n'est pas en vente).
 */
export const tools = [
	{
		toolKey: 'site',
		label: 'Site internet',
		pitch: 'Le site de votre pharmacie, à votre image, modifiable en quelques clics.'
	},
	{
		toolKey: 'booking',
		label: 'Rendez-vous',
		pitch: 'Vos patients réservent en ligne : vaccins, tests, entretiens pharmaceutiques.'
	},
	{
		toolKey: 'prescriptions',
		label: 'Ordonnances',
		pitch: 'Recevez les ordonnances envoyées depuis votre site et préparez-les à l’avance.'
	},
	{
		toolKey: 'planning',
		label: 'Planning',
		pitch: 'Le planning de votre équipe, ses absences et ses présences, au même endroit.'
	}
] as const satisfies readonly ToolDefinition[];

type ToolDefinition = { toolKey: string; label: string; pitch: string };

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
