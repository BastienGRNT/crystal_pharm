<script lang="ts">
	import { Field, SuggestionInput, type SuggestionInputOption } from '@crystal-pharm/ui';
	import { searchFrenchAddresses, type FrenchAddress, type FrenchAddressSuggestion } from './frenchAddressSearch';

	type StreetAddressFieldProps = {
		name: string;
		street?: string;
		errorMessage?: string;
		onAddressChoose: (address: FrenchAddress) => void;
	};

	let { name, street = $bindable(''), errorMessage, onAddressChoose }: StreetAddressFieldProps = $props();

	const minimumCharactersToSearch = 3;
	const pauseBeforeSearchInMilliseconds = 250;

	let addressSuggestions = $state<FrenchAddressSuggestion[]>([]);
	let pendingSearchTimer: ReturnType<typeof setTimeout> | undefined;
	let pendingSearch: AbortController | undefined;

	const suggestions: SuggestionInputOption[] = $derived(
		addressSuggestions.map((suggestion) => ({
			key: suggestion.key,
			label: suggestion.street,
			detail: `${suggestion.postalCode} ${suggestion.city}`
		}))
	);

	// On attend une courte pause dans la frappe, et chaque recherche annule la précédente.
	function searchAfterTypingPause(typedAddress: string): void {
		clearTimeout(pendingSearchTimer);
		pendingSearch?.abort();
		if (typedAddress.trim().length < minimumCharactersToSearch) {
			addressSuggestions = [];
			return;
		}
		pendingSearchTimer = setTimeout(() => void searchAddresses(typedAddress), pauseBeforeSearchInMilliseconds);
	}

	async function searchAddresses(typedAddress: string): Promise<void> {
		const search = new AbortController();
		pendingSearch = search;
		try {
			addressSuggestions = await searchFrenchAddresses(typedAddress, search.signal);
		} catch {
			// Service injoignable : la saisie à la main reste possible.
			if (!search.signal.aborted) addressSuggestions = [];
		}
	}

	function chooseSuggestion(chosenOption: SuggestionInputOption): void {
		const chosenAddress = addressSuggestions.find((suggestion) => suggestion.key === chosenOption.key);
		if (!chosenAddress) return;
		street = chosenAddress.street;
		addressSuggestions = [];
		onAddressChoose(chosenAddress);
	}
</script>

<Field label="Adresse" hint="Tapez le début de l’adresse, puis choisissez-la dans la liste." {errorMessage}>
	{#snippet control(controlAttributes)}
		<SuggestionInput
			{...controlAttributes}
			{name}
			bind:value={street}
			{suggestions}
			icon="map-pin"
			autocomplete="address-line1"
			required
			onTextInput={searchAfterTypingPause}
			onSuggestionChoose={chooseSuggestion}
		/>
	{/snippet}
</Field>
