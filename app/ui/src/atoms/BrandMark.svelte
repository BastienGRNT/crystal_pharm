<script lang="ts">
	type BrandMarkProps = {
		size?: number;
	};

	let { size = 40 }: BrandMarkProps = $props();

	const brandMarkId = $props.id();
	const crossClipPathId = `brand-mark-cross-${brandMarkId}`;
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
	<defs>
		<clipPath id={crossClipPathId}>
			<path
				d="M20 4h8a4 4 0 0 1 4 4v8h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8H8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4h8V8a4 4 0 0 1 4-4z"
			/>
		</clipPath>
	</defs>
	<g clip-path="url(#{crossClipPathId})">
		<rect width="48" height="48" class="fill-logo-base" />
		<path d="M0 0H48V48Z" class="fill-logo-facet" />
		<path d="M24 0L48 24H24Z" class="fill-logo-highlight" opacity="0.55" />
	</g>
</svg>
