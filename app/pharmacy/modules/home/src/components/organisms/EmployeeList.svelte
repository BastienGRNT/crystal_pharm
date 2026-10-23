<script lang="ts">
	import { Button, ConfirmButton, PersonLabel } from '@crystal-pharm/ui';
	import type { TeamMember } from '../../pages/pharmacy/pharmacyPageData';

	type EmployeeListProps = {
		team: TeamMember[];
		/** L'action SvelteKit qui retire un membre (`?/removeEmployee`), avec son `employeeId`. */
		removeAction: string;
	};

	let { team, removeAction }: EmployeeListProps = $props();
</script>

<ul class="grid divide-y divide-line-soft">
	{#each team as teamMember (teamMember.employeeId)}
		<li class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
			<PersonLabel name={teamMember.fullName} detail={teamMember.identity.jobTitle} imageUrl={teamMember.photoUrl} />
			<div class="flex items-center gap-1">
				<Button href={teamMember.editHref} variant="ghost" icon="pencil-simple">Modifier</Button>
				<form method="POST" action={removeAction}>
					<ConfirmButton
						label="Retirer"
						icon="trash"
						variant="ghost"
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
