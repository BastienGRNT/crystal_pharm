import * as v from 'valibot';

/** Les icônes que chaque layout doit savoir dessiner. */
export const ServiceIconNameSchema = v.picklist(['syringe', 'test-tube', 'heart-pulse', 'pill', 'leaf']);

export const ServicesModuleDataSchema = v.object({
  services: v.array(
    v.object({
      title: v.pipe(v.string(), v.nonEmpty()),
      description: v.pipe(v.string(), v.nonEmpty()),
      iconName: v.optional(ServiceIconNameSchema),
      /** L'icône choisie par la pharmacie : elle remplace celle d'`iconName`. */
      iconUrl: v.optional(v.string()),
    }),
  ),
});

export type ServicesModuleData = v.InferOutput<typeof ServicesModuleDataSchema>;
export type ServiceIconName = v.InferOutput<typeof ServiceIconNameSchema>;
