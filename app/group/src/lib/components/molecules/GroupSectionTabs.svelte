<script lang="ts">
	import { page } from '$app/state';
	import { PageTabs, type FilterTab } from '@crystal-pharm/ui';
	import { groupPathnames } from '$lib/groupPathnames';

	type GroupSectionTabsProps = {
		isContractAwaitingPayment: boolean;
	};

	let { isContractAwaitingPayment }: GroupSectionTabsProps = $props();

	const sections = [
		{ label: 'Fiche', href: groupPathnames.profile },
		{ label: 'Contrat', href: groupPathnames.contract },
		{ label: 'Factures', href: groupPathnames.invoices },
		{ label: 'Équipe', href: groupPathnames.team }
	];

	const tabs: FilterTab[] = $derived(
		sections.map((section) => ({
			...section,
			isCurrent: page.url.pathname === section.href || page.url.pathname.startsWith(`${section.href}/`),
			needsAttention: section.href === groupPathnames.contract && isContractAwaitingPayment
		}))
	);
</script>

<PageTabs label="Mon groupement" {tabs} />
