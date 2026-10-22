<script lang="ts">
	type LogoMarkProps = {
		size?: number;
		/** `rail` : la version sombre, sur la colonne de navigation ; `page` : suit le thème. */
		surface?: 'rail' | 'page';
	};

	let { size = 28, surface = 'rail' }: LogoMarkProps = $props();

	const componentId = $props.id();
	const clipPathId = `logo-cross-${componentId}`;

	// Ses teintes viennent du fichier du logo, pas des tokens : le symbole ne
	// change jamais avec le module.
	const fillClassesBySurface = {
		rail: { base: 'fill-[#3f9c78]', facet: 'fill-[#9bdcc0]', highlight: 'fill-[#f2efe8]' },
		page: { base: 'fill-logo-base', facet: 'fill-logo-facet', highlight: 'fill-logo-highlight' }
	};
	const fillClasses = $derived(fillClassesBySurface[surface]);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 48 48"
	width={size}
	height={size}
	aria-hidden="true"
	class="flex-none"
>
	<defs>
		<clipPath id={clipPathId}>
			<path
				d="M20 4h8a4 4 0 0 1 4 4v8h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8H8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4h8V8a4 4 0 0 1 4-4z"
			/>
		</clipPath>
	</defs>
	<g clip-path="url(#{clipPathId})">
		<rect width="48" height="48" class={fillClasses.base} />
		<path d="M0 0H48V48Z" class={fillClasses.facet} />
		<path d="M24 0L48 24H24Z" class={fillClasses.highlight} opacity="0.55" />
	</g>
</svg>
