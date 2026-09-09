import { custom } from '../../design';

// Sur-mesure : aucune promesse, pas même les informations de la pharmacie.
// `tenants` n'est pas optionnel — un sur-mesure sans destinataire n'existe pas —
// et la restriction est vérifiée côté serveur, pas seulement cachée du manager.
export default custom({
	name: 'Groupement Alpha',
	reorderable: false,
	tenants: ['alpha-sante']
});
