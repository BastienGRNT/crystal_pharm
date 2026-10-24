import { render } from 'solid-js/web';
import { PlaygroundApp } from './components/PlaygroundApp';
import { fetchPlaygroundCatalog } from './connections/playgroundApi';
import './playground.css';

const root = document.getElementById('playground');
if (!root) throw new Error('Élément #playground introuvable dans index.html.');

fetchPlaygroundCatalog()
  .then((catalog) => render(() => <PlaygroundApp catalog={catalog} />, root))
  .catch((error: unknown) => {
    root.textContent = `Le banc d'essai n'a pas pu charger son catalogue : ${error instanceof Error ? error.message : String(error)}`;
  });
