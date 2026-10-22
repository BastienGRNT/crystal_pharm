<script lang="ts">
	let { size = 28 }: { size?: number } = $props();

	const componentId = $props.id();
	const clipPathId = `logo-cross-${componentId}`;
</script>

<!-- Version sombre du symbole, pour la colonne de navigation : ses teintes viennent du fichier du logo, pas des tokens. -->
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
		<rect width="48" height="48" fill="#3f9c78" />
		<path d="M0 0H48V48Z" fill="#9bdcc0" />
		<path d="M24 0L48 24H24Z" fill="#f2efe8" opacity="0.55" />
	</g>
</svg>
