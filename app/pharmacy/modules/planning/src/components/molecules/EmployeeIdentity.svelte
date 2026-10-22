<script lang="ts">
	import { Tag } from '@crystal-pharm/ui';

	type EmployeeIdentityProps = {
		name: string;
		detail: string;
		/** Une étiquette courte après le nom (« Ph » pour un pharmacien). */
		tag?: string;
	};

	let { name, detail, tag }: EmployeeIdentityProps = $props();
</script>

<b class="block font-semibold text-ink">
	{name}
	{#if tag}
		<span class="ml-0.5"><Tag>{tag}</Tag></span>
	{/if}
</b>
<small class="text-small block text-ink-subtle">{detail}</small>
