import * as v from 'valibot';

export const OnlineOrderModuleDataSchema = v.object({
  /** Le site de commande de la pharmacie. Les QR codes imprimés pointent vers l'adresse stable du site, qui redirige ici. */
  url: v.pipe(v.string(), v.url()),
  introduction: v.optional(v.string()),
});

export type OnlineOrderModuleData = v.InferOutput<typeof OnlineOrderModuleDataSchema>;
