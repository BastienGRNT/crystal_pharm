import { signature } from '../../design';

// Gamme Signature : on ne garantit que les informations de la pharmacie et les
// horaires. Ce design ajoute une bannière et un texte de présentation, et
// n'affiche volontairement ni équipe, ni marques, ni avis.
export default signature({
	name: 'Azur',
	reorderable: false
});
