import * as v from 'valibot';

/** Le layout essentiel n'a aucun réglage : il ne contient que l'obligatoire. */
export const essentialSettingsSchema = v.object({});

export type EssentialSettings = v.InferOutput<typeof essentialSettingsSchema>;
