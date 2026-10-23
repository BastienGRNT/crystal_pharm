<script lang="ts">
	import { Tag } from '@crystal-pharm/ui';

	type EmployeeIdentityProps = {
		name: string;
		detail: string;
		/** Une étiquette courte après le nom (« Ph » pour un pharmacien). */
		tag?: string;
		/** Le total d'heures, aligné à droite du nom. */
		hours?: string;
	};

	let { name, detail, tag, hours }: EmployeeIdentityProps = $props();
</script>

<span class="flex items-baseline gap-2">
	<b class="min-w-0 flex-1 font-semibold text-ink">
		{name}
		{#if tag}
			<span class="ml-0.5"><Tag>{tag}</Tag></span>
		{/if}
	</b>
	{#if hours}
		<span class="text-small flex-none font-normal text-ink-subtle tabular-nums">{hours}</span>
	{/if}
</span>
<small class="text-small block text-ink-subtle">{detail}</small>
