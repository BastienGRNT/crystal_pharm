export function SectionHeading(props: { id: string; children: string }) {
  return (
    <h2 class="sb-heading" id={props.id}>
      {props.children}
    </h2>
  );
}
