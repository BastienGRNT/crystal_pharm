/** Une zone cliquable pour choisir une photo ou un PDF ; le nom du fichier choisi remplace l'invite. */
export function FileDropzone(props: {
  prompt: string;
  fileNames: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) {
  return (
    <span class="nb-dropzone">
      <input
        class="nb-dropzone__input"
        type="file"
        accept="image/*,application/pdf"
        multiple={props.multiple}
        onInput={(event) => props.onFiles(Array.from(event.currentTarget.files ?? []))}
      />
      <span class="nb-dropzone__text">{props.fileNames || props.prompt}</span>
    </span>
  );
}
