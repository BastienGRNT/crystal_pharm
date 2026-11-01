import { Icon } from '../atoms/Icon';

/** Une zone cliquable pour choisir une photo ou un PDF ; le nom du fichier choisi remplace l'invite. */
export function FileDropzone(props: { prompt: string; fileNames: string; multiple?: boolean; onFiles: (files: File[]) => void }) {
  return (
    <span class="nb-dropzone" classList={{ 'nb-dropzone--filled': props.fileNames !== '' }}>
      <input
        class="nb-dropzone__input"
        type="file"
        accept="image/*,application/pdf"
        multiple={props.multiple}
        onInput={(event) => props.onFiles(Array.from(event.currentTarget.files ?? []))}
      />
      <Icon name={props.fileNames ? 'check' : 'plus'} />
      <span class="nb-dropzone__text">{props.fileNames || props.prompt}</span>
    </span>
  );
}
