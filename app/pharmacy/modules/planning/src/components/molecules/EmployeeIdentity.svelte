<script lang="ts">
	import { Tag } from '@crystal-pharm/ui';
	import type { EmployeeHoursStatus } from '../../domain/live/liveWeek';
	import { hoursStatusClasses } from '../organisms/week/weekCalendar';

	type EmployeeIdentityProps = {
		name: string;
		detail: string;
		/** Une étiquette courte après le nom (« Ph » pour un pharmacien). */
		tag?: string;
		/** Le total d'heures, aligné à droite du nom. */
		hours?: string;
		/** Rouge quand il lui manque des heures ou qu'il en a trop. */
		hoursStatus?: EmployeeHoursStatus;
	};

	let { name, detail, tag, hours, hoursStatus = 'ok' }: EmployeeIdentityProps = $props();
</script>

<span class="flex items-baseline gap-2">
	<b class="min-w-0 flex-1 font-semibold text-ink">
		{name}
		{#if tag}
			<span class="ml-0.5"><Tag>{tag}</Tag></span>
		{/if}
	</b>
	{#if hours}
		<span class="text-small flex-none tabular-nums {hoursStatus === 'ok' ? 'font-normal' : ''} {hoursStatusClasses[hoursStatus]}">{hours}</span>
	{/if}
</span>
<small class="text-small block text-ink-subtle">{detail}</small>
