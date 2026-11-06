import * as v from 'valibot';

/**
 * Les modules : les blocs que la pharmacie active ou non, et dont elle choisit l'ordre.
 * L'ordre de cette liste est l'ordre par défaut. Ce qui est toujours présent est une section fixe (`FixedSectionsSchema`).
 */
export const ModuleNameSchema = v.picklist([
  'prescriptionUpload',
  'appointment',
  'onlineOrder',
  'dutyHotline',
  'services',
  'team',
  'brands',
  'loyaltyCard',
  'news',
]);

export type ModuleName = v.InferOutput<typeof ModuleNameSchema>;
