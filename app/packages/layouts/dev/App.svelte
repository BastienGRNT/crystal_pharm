<script lang="ts">
	import LayoutHost from '../src/render/LayoutHost.svelte';

	import { catalogueOrdonne } from '../src/layouts/catalogue-ordonne/layout';
	import { catalogueFixe } from '../src/layouts/catalogue-fixe/layout';
	import { cataloguePlusUn } from '../src/layouts/catalogue-plus-un/layout';
	import { uniqueOrdonne } from '../src/layouts/unique-ordonne/layout';
	import { uniqueFixe } from '../src/layouts/unique-fixe/layout';

	import { catalogueOrdonneActive, catalogueOrdonneData } from './mocks/catalogue-ordonne';
	import { catalogueFixeActive, catalogueFixeData } from './mocks/catalogue-fixe';
	import { cataloguePlusUnActive, cataloguePlusUnData } from './mocks/catalogue-plus-un';
	import { uniqueOrdonneActive, uniqueOrdonneData } from './mocks/unique-ordonne';
	import { uniqueFixeActive, uniqueFixeData } from './mocks/unique-fixe';

	import { visibleModules } from '../src/layout';

	// Chaque layout a son mock : un layout se regarde avec ses propres
	// données, pas avec un jeu commun.
	const previews = [
		{ layout: catalogueOrdonne, active: catalogueOrdonneActive },
		{ layout: catalogueFixe, active: catalogueFixeActive },
		{ layout: cataloguePlusUn, active: cataloguePlusUnActive },
		{ layout: uniqueOrdonne, active: uniqueOrdonneActive },
		{ layout: uniqueFixe, active: uniqueFixeActive }
	];
</script>

<h1>Preview des layouts</h1>
<p class="hint">Modifier un mock dans <code>dev/mocks/</code> pour voir l'effet.</p>

{#each previews as preview (preview.layout.id)}
	<article>
		<header>
			<h2>{preview.layout.id}</h2>
			<p>
				<span class="tag">{preview.layout.kind}</span>
				<span class="tag" class:on={preview.layout.orderable}>
					{preview.layout.orderable ? 'réordonnable par le site' : 'ordre imposé par le layout'}
				</span>
			</p>
			<p class="order">
				demandé : {preview.active.map((entry) => entry.module).join(' → ')}<br />
				affiché : {visibleModules(preview.layout, preview.active).join(' → ')}
			</p>
		</header>
		<div class="frame">
			{#if preview.layout === catalogueOrdonne}
				<LayoutHost layout={catalogueOrdonne} active={catalogueOrdonneActive} data={catalogueOrdonneData} />
			{:else if preview.layout === catalogueFixe}
				<LayoutHost layout={catalogueFixe} active={catalogueFixeActive} data={catalogueFixeData} />
			{:else if preview.layout === cataloguePlusUn}
				<LayoutHost layout={cataloguePlusUn} active={cataloguePlusUnActive} data={cataloguePlusUnData} />
			{:else if preview.layout === uniqueOrdonne}
				<LayoutHost layout={uniqueOrdonne} active={uniqueOrdonneActive} data={uniqueOrdonneData} />
			{:else}
				<LayoutHost layout={uniqueFixe} active={uniqueFixeActive} data={uniqueFixeData} />
			{/if}
		</div>
	</article>
{/each}

<style>
	:global(body) {
		background: #f7f8fa;
		font-family: system-ui, sans-serif;
		margin: 0;
		padding: 2rem 1.5rem 4rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.hint {
		color: #616e7c;
		margin-top: 0.25rem;
	}
	article {
		margin-top: 2rem;
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 12px;
		overflow: hidden;
	}
	header {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e4e7eb;
		background: #fbfcfd;
	}
	header h2 {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
	}
	header p {
		margin: 0;
	}
	.tag {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: #e4e7eb;
		color: #3e4c59;
		font-size: 0.78rem;
		margin-right: 0.35rem;
	}
	.tag.on {
		background: #d1fae5;
		color: #065f46;
	}
	.order {
		margin-top: 0.5rem;
		color: #7b8794;
		font-size: 0.8rem;
		line-height: 1.5;
	}
	.frame {
		padding: 1rem 1.25rem;
	}
</style>
