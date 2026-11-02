import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { ShiftPreview } from '../../domain/live/liveWeek';

/** Le créneau tel que le geste l'a laissé : sans `shiftId`, c'est un nouveau créneau. */
export type ShiftChange = ShiftPreview;

export type ShiftChangeActions = { updateShiftAction: string; addShiftAction: string };

/** Le créneau visé par un clic droit, et comment l'annoncer aux lecteurs d'écran. */
export type ShiftMenuTarget = { shiftId: string; label: string };

/** Enregistre un glisser-déposer par les actions de formulaire, sans quitter la page. Renvoie le message d'un refus. */
export async function submitShiftChange(actions: ShiftChangeActions, change: ShiftChange): Promise<string | undefined> {
	const body = new FormData();
	for (const [fieldName, value] of Object.entries(change)) body.set(fieldName, value);

	return postShiftFormAction(change.shiftId ? actions.updateShiftAction : actions.addShiftAction, body, 'Le créneau n’a pas pu être enregistré.');
}

/** Supprime un créneau par l'action de formulaire, sans quitter la page. Renvoie le message d'un refus. */
export async function submitShiftRemoval(deleteShiftAction: string, shiftId: string): Promise<string | undefined> {
	const body = new FormData();
	body.set('slotId', shiftId);

	return postShiftFormAction(deleteShiftAction, body, 'Le créneau n’a pas pu être supprimé.');
}

async function postShiftFormAction(action: string, body: FormData, fallbackMessage: string): Promise<string | undefined> {
	const response = await fetch(action, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
	const result = deserialize(await response.text());
	await invalidateAll();
	if (result.type === 'failure') return String(result.data?.message ?? fallbackMessage);
	if (result.type === 'error') return fallbackMessage;
	return undefined;
}
