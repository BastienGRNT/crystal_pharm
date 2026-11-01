<script lang="ts">
	import { responsibilities } from '@crystal-pharm/pharmacy-db/domain';
	import { Button, PersonLabel, Tag } from '@crystal-pharm/ui';
	import type { AccessMember } from '../../../pages/pharmacy/pharmacyPageData';

	let { members }: { members: AccessMember[] } = $props();

	function summarizeResponsibilities(member: AccessMember): string {
		if (member.isOwner) return 'Tous les droits, abonnement et accès compris';
		const labels = responsibilities
			.filter(({ responsibilityKey }) => member.responsibilityKeys.includes(responsibilityKey))
			.map(({ label }) => label);
		return labels.length > 0 ? labels.join(' · ') : 'Aucune responsabilité';
	}
</script>

<ul class="-my-1 grid divide-y divide-dashed divide-line-strong/40">
	{#each members as member (member.accountId)}
		<li class="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1">
			<div class="grid min-w-0 gap-1">
				<PersonLabel name={member.isSignedInAccount ? `${member.name} (vous)` : member.name} detail={member.detail} />
				<p class="flex flex-wrap items-center gap-2 text-small text-ink-muted">
					<Tag tone={member.isOwner ? 'accent' : 'neutral'}>{member.kindLabel}</Tag>
					{summarizeResponsibilities(member)}
				</p>
			</div>
			<Button href={member.editHref} variant="secondary" size="compact" icon="pencil-simple">Modifier</Button>
		</li>
	{/each}
</ul>
