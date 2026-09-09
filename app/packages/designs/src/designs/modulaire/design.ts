import { complete } from '../../design';

// Réordonnable : aucune section ne suppose sa position. Elles portent toutes
// leur propre marge et fonctionnent isolément, où qu'on les place.
export default complete({
	name: 'Modulaire',
	reorderable: true
});
