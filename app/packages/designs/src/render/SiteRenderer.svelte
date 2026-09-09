<script lang="ts">
	import type { Design } from '../designs';
	import type { SectionName } from '../sections/registry';
	import { parseContent } from '../site';
	import { provideSite } from './context';

	/**
	 * Le seul composant qui rend un site. Il prend le contenu en `unknown` : il
	 * n'existe aucun chemin pour alimenter un design sans franchir la frontière.
	 */
	let {
		design,
		content,
		order = null,
		onsections = undefined
	}: {
		design: Design;
		content: unknown;
		order?: unknown;
		/** Reçoit les sections que le design affiche réellement. */
		onsections?: (sections: readonly SectionName[]) => void;
	} = $props();

	const parsed = $derived(parseContent(content));

	provideSite(() => ({
		content: parsed,
		storedOrder: order,
		reorderable: design.declaration.reorderable,
		declare: (sections) => onsections?.(sections)
	}));
</script>

<design.Page />
