export function ToggleSwitch(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label class="toggle">
      <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.currentTarget.checked)} />
      <span class="toggle__track" aria-hidden="true" />
      <span>{props.label}</span>
    </label>
  );
}
