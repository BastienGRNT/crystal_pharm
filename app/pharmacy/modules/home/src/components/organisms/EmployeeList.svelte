<script lang="ts">
	import { Avatar, Button, ConfirmButton } from '@crystal-pharm/ui';
	import type { TeamMember } from '../../pages/pharmacy/pharmacyPageData';

	type EmployeeListProps = {
		team: TeamMember[];
		/** L'action SvelteKit qui retire un membre (`?/removeEmployee`), avec son `employeeId`. */
		removeAction: string;
	};

	let { team, removeAction }: EmployeeListProps = $props();
</script>

<!-- Un trombinoscope : l'équipe telle que les patients la verront sur le site. -->
<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each team as teamMember (teamMember.employeeId)}
		<li class="grid overflow-hidden rounded-xl border border-line bg-surface shadow-card">
			<div class="grid justify-items-center gap-3 px-5 pt-6 pb-4 text-center">
				<Avatar name={teamMember.fullName} imageUrl={teamMember.photoUrl} size="large" />
				<div class="grid gap-0.5">
					<p class="font-display text-[19px] leading-6 text-ink">{teamMember.identity.firstName} <span class="uppercase">{teamMember.identity.lastName}</span></p>
					<p class="text-small text-ink-muted">{teamMember.identity.jobTitle}</p>
				</div>
			</div>
			<div class="flex items-center justify-center gap-1 border-t border-dashed border-line-strong/50 bg-surface-subtle px-3 py-2">
				<Button href={teamMember.editHref} variant="ghost" size="compact" icon="pencil-simple">Modifier</Button>
				<form method="POST" action={removeAction}>
					<ConfirmButton
						label="Retirer"
						icon="trash"
						variant="ghost"
						size="compact"
						title="Retirer {teamMember.fullName} de l’équipe ?"
						description="Son nom, son poste et sa photo ne s’afficheront plus sur votre site."
						confirmLabel="Retirer de l’équipe"
						isDestructive
						name="employeeId"
						value={teamMember.employeeId}
					/>
				</form>
			</div>
		</li>
	{/each}
</ul>
