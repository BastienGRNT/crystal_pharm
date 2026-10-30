import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { ShiftPreview } from '../../domain/live/liveWeek';

/** Le créneau tel que le geste l'a laissé : sans `shiftId`, c'est un nouveau créneau. */
export type ShiftChange = ShiftPreview;

export type ShiftChangeActions = { updateShiftAction: string; addShiftAction: string };

/** Enregistre un glisser-déposer par les actions de formulaire, sans quitter la page. Renvoie le message d'un refus. */
export async function submitShiftChange(actions: ShiftChangeActions, change: ShiftChange): Promise<string | undefined> {
	const body = new FormData();
	for (const [fieldName, value] of Object.entries(change)) body.set(fieldName, value);

	const response = await fetch(change.shiftId ? actions.updateShiftAction : actions.addShiftAction, {
		method: 'POST',
		body,
		headers: { 'x-sveltekit-action': 'true' }
	});
	const result = deserialize(await response.text());
	await invalidateAll();
	if (result.type === 'failure') return String(result.data?.message ?? 'Le créneau n’a pas pu être enregistré.');
	if (result.type === 'error') return 'Le créneau n’a pas pu être enregistré.';
	return undefined;
}
