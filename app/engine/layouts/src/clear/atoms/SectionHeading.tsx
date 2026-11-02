export function SectionHeading(props: { id: string; children: string }) {
  return (
    <h2 class="cl-heading" id={props.id}>
      {props.children}
    </h2>
  );
}
