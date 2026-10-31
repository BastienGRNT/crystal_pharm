import * as v from 'valibot';

/** Soit la prise de rendez-vous de la plateforme, soit un lien vers l'outil que la pharmacie utilise déjà. */
export const AppointmentModuleDataSchema = v.variant('mode', [
  v.object({ mode: v.literal('builtIn'), introduction: v.optional(v.string()) }),
  v.object({ mode: v.literal('externalLink'), url: v.pipe(v.string(), v.url()) }),
]);

export type AppointmentModuleData = v.InferOutput<typeof AppointmentModuleDataSchema>;
