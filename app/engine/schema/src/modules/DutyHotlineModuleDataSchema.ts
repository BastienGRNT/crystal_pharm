import * as v from 'valibot';

/** Le rappel du numéro national de garde : le numéro est le même partout, la pharmacie ne choisit que s'il s'affiche et où. */
export const DutyHotlineModuleDataSchema = v.object({});

export type DutyHotlineModuleData = v.InferOutput<typeof DutyHotlineModuleDataSchema>;
